import express from "express"
import supabase from "../libs/supabase"
import { generateToken, getEmailSanitized, stringer } from "../libs/utils"
import validator from "validator"
import { errorResponser, internalServerError, invalidInputResponser, responser } from "../libs/routeFunctions/responser"
import verifyToken from "../libs/turnstile"
import sendEmail from "../libs/emailer"
import routeFunctionWrapper from "../libs/routeFunctions/routeWrapper"
import { createLimiter } from "../libs/rateLimiter"
import {times} from "../libs/constants"
import bcrypt from "bcrypt"
import redisInstance from "../libs/redisManager"
import Crypto from "node:crypto"

const route = express.Router()
const authLimiter = createLimiter(60 * 1000, 20, "ip")

route.use(authLimiter)

const getEmailBody = ({sanitizedName, verificationLink} : {sanitizedName: string, verificationLink: string}): string => {
  return `
    <h1>Welcome ${sanitizedName || 'to our app'}!</h1>
    <p>Thanks for signing up. Please verify your email to get started:</p>
    <a href="${verificationLink}" style="display:inline-block;padding:12px 24px;background:#4CAF50;color:white;text-decoration:none;border-radius:4px;">
      Verify Email
    </a>
    <p>If the button doesn't work, copy this link:</p>
    <p style="word-break:break-all;">${verificationLink}</p>
    <p>This link expires in 24 hours.</p>
    <p>If you didn't sign up, ignore twhat if I add a random string generatorhis email.</p>
  `
}
const getVerificationLink = (verificationToken: string, email: string) => `http://localhost:${process.env.PORT}/authentication/email-verfication-token-verify?token=${verificationToken}&email=${email}`

route.post("/signup", async (req, res) => {
  routeFunctionWrapper(async () => {
    const { name, email, password, repassword, turnstileToken } = req.body

    const token = stringer(turnstileToken, {
      acceptNumbers: true,
      htmlSanitize: false,
      maximumCap: Infinity,
      returnNullIfResultIsEmpty: true,
      trimmed: false
    })
    if(!token) return invalidInputResponser(res, {errorCode: "noToken"})
    
    const tokenVerified = await verifyToken(token, req)
    if(tokenVerified.error) return invalidInputResponser(res, {errorCode: "tokenInvalid"})
    
    const sanitizedName = stringer(name, {maximumCap: 100}) || ""
    if(sanitizedName.length < 3) return invalidInputResponser(res, {errorCode: "nameTooShort"})

    const sanitizedEmail = await getEmailSanitized(email, res)
    if(typeof sanitizedEmail == "object") return sanitizedEmail.response

    const sanitizedPassword = stringer(password, {maximumCap: 101})
    if(!sanitizedPassword) return invalidInputResponser(res, {errorCode: "passwordNotProvided"})
    if(sanitizedPassword.length > 100) return invalidInputResponser(res, {errorCode: "passwordTooLong"})
    if(sanitizedPassword.length < 8) return invalidInputResponser(res, {errorCode: "passwordTooShort"})
    if(!validator.isStrongPassword(sanitizedPassword, {
      minLength: 8,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    })) return invalidInputResponser(res, {errorCode: "passwordWeak"})

    const sanitizedRepassword = stringer(repassword, {maximumCap: 101})
    if(!sanitizedRepassword) return invalidInputResponser(res, {errorCode: "repasswordNotProvided"})
    if(sanitizedRepassword != sanitizedPassword) return invalidInputResponser(res, {errorCode: "passwordsDontMatch"})

    // Signup logic

    // Creating the user:
    const { data: _signupData, error: signupError } = await supabase.auth.admin.createUser({
      email: sanitizedEmail,
      password: sanitizedPassword,
      email_confirm: false,
      user_metadata: {
        name: sanitizedName
      }
    })

    if(signupError) return errorResponser(res, {
      errorCode: `supabase_createUser.${signupError.code}`,
      status: Number(signupError.status || 400)
    })
    
    // If the user is successfully created, send the client an OK response so he tells the user to login back again after verifying the email.
    else {
      const verificationToken = generateToken(32)
      const verificationLink = getVerificationLink(verificationToken, sanitizedEmail)
      await redisInstance.connect()

      const redisTokenResult = await redisInstance.emailVerifier("set", {token: verificationToken, email: sanitizedEmail})

      if(!redisTokenResult || !redisTokenResult.done) {
        return errorResponser(res, {
          errorCode: "emailVerificationFailed",
          status: 502
        })
      }

      const emailSent = await sendEmail(
        sanitizedEmail,
        getEmailBody({sanitizedName, verificationLink}),
        "Verify Your Email",
        sanitizedName
      )

      if (!emailSent) {
        console.error(`Failed to send verification email to ${sanitizedEmail}`)
        return errorResponser(res, {
          errorCode: "emailVerificationFailed",
          status: 502
        })
      }

      return responser(res, {
        error: false,
        status: 200
      })
    }
  }, req, res)
})

route.get("/email-verfication-token-verify", async (req, res) => {
  routeFunctionWrapper(async () => {
    const { token, email } = req.query
    const baseUrl = "http://localhost:5173/verification-status"
    const baseUrlGood = `${baseUrl}?error=false`
    const baseUrlBad = `${baseUrl}?error=true`

    const newToken = stringer(token, {
      acceptNumbers: false,
      htmlSanitize: false,
      trimmed: true,
      maximumCap: 65,
      returnNullIfResultIsEmpty: true
    })

    const newEmail = stringer(email, {
      acceptNumbers: false,
      htmlSanitize: false,
      trimmed: true,
      maximumCap: 255,
      returnNullIfResultIsEmpty: true
    })

    if(!newToken || !newEmail) return res.redirect(baseUrlBad)

    await redisInstance.connect()
    const emailOfToken = await redisInstance.emailVerifier("get", {token: newToken})
    if(!emailOfToken || !emailOfToken.exists) return res.redirect(baseUrlBad)
    if(!Crypto.timingSafeEqual(Buffer.from(emailOfToken.email), Buffer.from(newEmail))) return res.redirect(baseUrlBad)

    const {error} = await supabase.rpc("auto_confirm_auth_user", {p_email: newEmail})
    if(error) return res.redirect(baseUrlBad)
    
    return res.redirect(baseUrlGood)
  }, req, res)
})

route.post("/resend-verification",
  createLimiter(times.minute * 5, 1, "email", "standard_cooldown"),
  createLimiter(times.hour, 5, "email", "hourly_rate"),
  createLimiter(times.day, 20, "email", "daily_rate"),
  async (req, res) => {
  routeFunctionWrapper(async () => {
    const { email, password, turnstileToken } = req.body

    const invalid = (errorCode: string) => invalidInputResponser(res, {errorCode})

    const newEmail = await getEmailSanitized(email, res)
    if(typeof newEmail == "object") return newEmail.response

    const newPassword = stringer(password, {acceptNumbers: true, htmlSanitize: true, maximumCap: 100, returnNullIfResultIsEmpty: true, trimmed: true})
    if(!newPassword) return invalid("passwordNotProvided")
    

    const token = stringer(turnstileToken, {
      acceptNumbers: true,
      htmlSanitize: false,
      maximumCap: Infinity,
      returnNullIfResultIsEmpty: true,
      trimmed: false
    })
    if(!token) return invalid("noToken")
    
    const tokenVerified = await verifyToken(token, req)
    if(tokenVerified.error) {console.log(tokenVerified.errorCode); return invalid("tokenInvalid")}
    
    // Manually checking for the password:

    const { data: encryptedPassword, error: userPasswordError } = await supabase.rpc("get_encrypted_password_by_email", {p_email: newEmail})
    if(userPasswordError) {console.log(userPasswordError);return internalServerError(res)}
      else {
        if(!encryptedPassword) return internalServerError(res)
          else {
            const passwordMatches = await bcrypt.compare(newPassword, encryptedPassword)
            if(!passwordMatches) return invalid("wrongPassword")
          }
      }

    const { data: userUUID, error } = await supabase.rpc("get_user_uuid_by_email", {email_text: newEmail})
    if(error) throw error
    else {
      if(!userUUID) return invalid("emailNotFound")

      const { data: {user}, error: userError } = await supabase.auth.admin.getUserById(userUUID as string)
      if(userError) throw userError
      else {
        if(!user) return invalid("emailNotFound")
        
        if(user.confirmed_at) return invalid("emailAlreadyVerified")
        if(!user.identities?.some(identity => identity.provider == "email")) return invalid("emailAlreadyVerified")

        else {
          const verificationToken = generateToken(32)
          const { data: userDataForName, error: errorOfName } = await supabase.from("users").select("name").eq("id", user.id).limit(1)
          if(errorOfName) throw errorOfName
          else {
            const username = userDataForName[0].name as string
            const isEmailSent = await sendEmail(
              newEmail,
              getEmailBody({sanitizedName: username, verificationLink: getVerificationLink(verificationToken, newEmail)}),
              "Verify your E-mail",
              username
            )

            if(!isEmailSent) {
              console.error(`Failed to send verification email to ${newEmail}`)
              return errorResponser(res, {
                errorCode: "emailVerificationFailed",
                status: 502
              })
            }
            
            await redisInstance.connect()
            const redisTokenRegistered = await redisInstance.emailVerifier("set", {token: verificationToken, email: newEmail})
            if(!redisTokenRegistered || !redisTokenRegistered.done) throw new Error("Redis Token Unregistered")
            return responser(res, {error: false, status: 200})
          }
        }
      }
    }
  }, req, res)
})

export default route