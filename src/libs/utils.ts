import type { Response } from "express"
import sanitizeHtml from "sanitize-html"
import { invalidInputResponser } from "./routeFunctions/responser"
import validator from "validator"
import disposableDomains from "disposable-email-domains"
import Crypto from "node:crypto"

interface StringerOptions {
  htmlSanitize?: boolean,
  maximumCap?  : number,
  acceptNumbers?: boolean,
  trimmed?: boolean,
  returnNullIfResultIsEmpty?: boolean
}

export function stringer(value: any, options: StringerOptions = {
  htmlSanitize: true,
  maximumCap: 100,
  acceptNumbers: true,
  trimmed: true,
  returnNullIfResultIsEmpty: true
}): string | null {
  let sanitized: string = ""
  if(typeof value == "string" || (options.acceptNumbers && !isNaN(Number(value)))) sanitized = String(value)
    else return null

  sanitized = sanitizeHtml(sanitized, {
    allowedTags: options.htmlSanitize ? [] : sanitizeHtml.defaults.allowedTags,
    allowedAttributes: options.htmlSanitize ? {} : sanitizeHtml.defaults.allowedAttributes
  })
  if(options.trimmed) sanitized = sanitized.trim()
  if(options.maximumCap) sanitized = sanitized.slice(0, Math.abs(options.maximumCap))

  if(options.returnNullIfResultIsEmpty) return sanitized.length ? sanitized : null
    else return sanitized
}

export function numberer(value: any): number | null {
  if(isNaN(Number(value))) return null
  else return Number(value)
}

type GetEmailSanitizedObject = {error: true, response: Response}
export async function getEmailSanitized(email: string, res: Response): Promise<string | GetEmailSanitizedObject> {
  const returning = stringer(email, {
    acceptNumbers: false, // Can't provide a string like "1"
    htmlSanitize: true,
    maximumCap: 255,
    returnNullIfResultIsEmpty: true,
    trimmed: true
  })

  const errorResponse = async (errorCode: string) => ({
    error: true,
    response: await invalidInputResponser(res, {errorCode})
  } as GetEmailSanitizedObject)

  if(!returning) return await errorResponse("emailNotProvided")
  if(!validator.isEmail(returning)) return await errorResponse("emailNotValid")

  const [local, domain] = returning.toLowerCase().split("@")
  if(disposableDomains.includes(domain)) return await errorResponse("disposableDomainNotAllowed")

  // Normalizing the E-mail:
  const newEmail = `${local.split("+")[0].replaceAll(".", "")}@${domain}`
  return newEmail
}

export function generateToken(bytes: number): string {
  const token = Crypto.randomBytes(bytes).toString("hex")
  return token
}