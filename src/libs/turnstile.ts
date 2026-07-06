import type { Request } from "express"
import dotenv from "dotenv"

dotenv.config()

export default async function verifyToken(
  token: string, 
  request: Request
): Promise<{ error: false } | { error: true, errorCode: string }> {
  
  const formData = new URLSearchParams()
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY!
  
  const forwardedHeader = request.headers['x-forwarded-for']
  const forwarded = Array.isArray(forwardedHeader) 
    ? forwardedHeader[0] 
    : forwardedHeader?.split(',')[0]
  const ip = forwarded ? forwarded.trim() : request.socket.remoteAddress

  formData.append("secret", secretKey)
  formData.append("response", token)
  if (ip) formData.append("remoteip", ip)

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    })

    const data = await response.json() as { success: boolean; "error-codes"?: string[] }
    
    if (data.success) {
      return { error: false }
    } else {
      return {
        error: true,
        errorCode: data["error-codes"]?.[0] || "missing-input-response" 
      }
    }
  } catch (err) {
    return {
      error: true,
      errorCode: "internal-verification-error"
    }
  }
}