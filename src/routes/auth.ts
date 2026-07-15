import express from "express"
import supabase from "../libs/supabase"
import { getEmailSanitized, stringer } from "../libs/utils"
import validator from "validator"
import { errorResponser, invalidInputResponser, responser } from "../libs/routeFunctions/responser"
import verifyToken from "../libs/turnstile"
import sendEmail from "../libs/emailer"
import routeFunctionWrapper from "../libs/routeFunctions/routeWrapper"
import { createLimiter } from "../libs/rateLimiter"
import {times} from "../libs/constants"
import { createClient } from "@supabase/supabase-js"

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
    const { data: signupData, error: signupError } = await supabase.auth.admin.createUser({
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
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        email: sanitizedEmail,
        type: "signup",
        password: sanitizedPassword,
        options: {
          redirectTo: `http://localhost:${process.env.PORT!}/authentication/callback`
        }
      })

      if(linkError) return errorResponser(res, {
        errorCode: "emailVerificationFailed",
        status: 502
      })

      const verificationLink = linkData.properties.action_link

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

route.get("/callback", async (req, res) => {
  routeFunctionWrapper(async () => {
    const { token } = req.query
    const baseUrl = "http://localhost:5173/verification-status"

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token as string,
      type: "email"
    })

    if(error && !data) return res.redirect(`${baseUrl}?error=true`)
      else return res.redirect(`${baseUrl}?error=false`)
  }, req, res)
})

route.post("/resend-verification",
    createLimiter(times.day, 20, "email", "hourly_rate"),
    createLimiter(times.hour, 5, "email", "hourly_rate"),
    createLimiter(times.minute * 5, 1, "email", "standard_cooldown"),
  async (req, res) => {
  routeFunctionWrapper(async () => {
    const { email, password, turnstileToken } = req.body

    const newEmail = await getEmailSanitized(email, res)
    if(typeof newEmail == "object") return newEmail.response

    const newPassword = stringer(password, {acceptNumbers: true, htmlSanitize: true, maximumCap: 100, returnNullIfResultIsEmpty: true, trimmed: true})
    if(!newPassword) return invalidInputResponser(res, {errorCode: "passwordNotProvided"})
    

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

    
    const verificationClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
    const { data: testSigninData, error: testSigninError } = await verificationClient.auth.signInWithPassword({
      email: newEmail,
      password: newPassword
    })
    if(testSigninError) return invalidInputResponser(res, {errorCode: "wrongPassword"})

    const { data: userUUID, error } = await supabase.rpc("get_user_uuid_by_email", {email_text: newEmail})
    if(error) throw error
    else {
      if(!userUUID) return invalidInputResponser(res, {errorCode: "emailNotFound"})

      const { data: {user}, error: userError } = await supabase.auth.admin.getUserById(userUUID as string)
      if(userError) throw userError
      else {
        if(!user) return invalidInputResponser(res, {errorCode: "emailNotFound"})
        
        if(user.confirmed_at) return invalidInputResponser(res, {errorCode: "emailAlreadyVerified"})
        if(!user.identities?.some(identity => identity.provider == "email")) return invalidInputResponser(res, {errorCode: "emailAlreadyVerified"})

        // The real E-mail sending logic, Password is required by Supabase.
        else {
          const { data: newLinkData, error: newLinkError } = await supabase.auth.admin.generateLink({
            type: "signup",
            email: newEmail,
            password: newPassword,
            options: {
              redirectTo: `http://localhost:${process.env.PORT!}/authentication/callback`
            }
          })

          if(newLinkError || !newLinkData) throw newLinkError
          else {
            const verificationLink = newLinkData.properties.action_link
            
            // Getting the user name from the public schema:
            const {data: publicData, error: publicDataError} = await supabase.from("users").select("name").eq("id", user.id).limit(1)
            if(publicDataError) throw publicDataError
            else {
              const name = publicData[0]!.name
              const emailSent = await sendEmail(newEmail, getEmailBody({verificationLink, sanitizedName: name}), "Verify your E-mail", name)
              
              if (!emailSent) {
                console.error(`Failed to send verification email to ${newEmail}`)
                return errorResponser(res, {
                  errorCode: "emailVerificationFailed",
                  status: 502
                })
              }
              else return responser(res, {
                error: false,
                status: 200
              })
            }
          }
        }
      }
    }
  }, req, res)
})

export default route