import express from "express"
import supabase from "../libs/supabase"
import { stringer } from "../libs/utils"
import { isEmail, isStrongPassword } from "validator"
import { errorResponser, invalidInputResponser, responser } from "../libs/routeFunctions/responser"

const route = express.Router()

route.post("/signup", async (req, res) => {
  const { name, email, password, repassword } = req.body
  
  const sanitizedName = stringer(name, {maximumCap: 100}) || ""
  if(sanitizedName.length < 3) return invalidInputResponser(res, {errorCode: "nameTooShort"})

  const sanitizedEmail = stringer(email, {maximumCap: 254})
  if(!sanitizedEmail) return invalidInputResponser(res, {errorCode: "emailNotProvided"})
  if(!isEmail(sanitizedEmail)) return invalidInputResponser(res, {errorCode: "emailNotValid"})

  const sanitizedPassword = stringer(password, {maximumCap: 101})
  if(!sanitizedPassword) return invalidInputResponser(res, {errorCode: "passwordNotProvided"})
  if(sanitizedPassword.length > 100) return invalidInputResponser(res, {errorCode: "passwordTooLong"})
  if(sanitizedPassword.length < 8) return invalidInputResponser(res, {errorCode: "passwordTooShort"})
  if(!isStrongPassword(sanitizedPassword, {
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
  
  // If the user is successfully created, send the client an OK response so he tells the user to login back again
  else return responser(res, {
    error: false,
    status: 200
  })
})

export default route