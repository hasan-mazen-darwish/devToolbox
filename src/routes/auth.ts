import express from "express"
import supabase from "../libs/supabase"
import { stringer } from "../libs/utils"
import validator from "validator"
import { errorResponser, invalidInputResponser, responser } from "../libs/routeFunctions/responser"
import verifyToken from "../libs/turnstile"
import sendEmail from "../libs/emailer"
import routeFunctionWrapper from "../libs/routeFunctions/routeWrapper"

const route = express.Router()

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

    const sanitizedEmail = stringer(email, {maximumCap: 254})
    if(!sanitizedEmail) return invalidInputResponser(res, {errorCode: "emailNotProvided"})
    if(!validator.isEmail(sanitizedEmail)) return invalidInputResponser(res, {errorCode: "emailNotValid"})

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
          redirectTo: `http://localhost:${process.env.PORT!}/auth/callback`
        }
      })

      if(linkError) return errorResponser(res, {
        errorCode: "emailVerificationFailed",
        status: 502
      })

      const verificationLink = linkData.properties.action_link

      const emailSent = await sendEmail(
        sanitizedEmail,
        `
          <h1>Welcome ${sanitizedName || 'to our app'}!</h1>
          <p>Thanks for signing up. Please verify your email to get started:</p>
          <a href="${verificationLink}" style="display:inline-block;padding:12px 24px;background:#4CAF50;color:white;text-decoration:none;border-radius:4px;">
            Verify Email
          </a>
          <p>If the button doesn't work, copy this link:</p>
          <p style="word-break:break-all;">${verificationLink}</p>
          <p>This link expires in 24 hours.</p>
          <p>If you didn't sign up, ignore this email.</p>
        `,
        "Verify Your Email"
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

    const { error } = await supabase.auth.verifyOtp({
      token_hash: token as string,
      type: "email"
    })

    if(error) return res.redirect(`${baseUrl}?error=true`)
      else return res.redirect(`${baseUrl}?error=false`)
  }, req, res)
})

export default route