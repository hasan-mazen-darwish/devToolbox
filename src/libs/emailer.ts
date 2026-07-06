import dotenv from "dotenv"

dotenv.config()

interface SendEmailReturnType {
  success: boolean,
  message: string,
  data: {
    reference_id: string
  }
}

export default async function sendEmail(to: string, html: string, subject: string = "Email Verification"): Promise<SendEmailReturnType | null> {
  try {
    const apiKey = process.env.MAILEROO_SENDING_KEY!

    const response = await fetch("https://smtp.maileroo.com/api/v2/emails/template", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "emailverifier@427fbaa5236497a7.maileroo.org",
        to,
        subject: subject,
        html
      })
    })
    const data = await response.json() as SendEmailReturnType

    if(!response.ok) throw new Error(data.message)
    return data
  }
  catch(error) {
    console.error(`Error sending email to ${to}:`, error)
    return null
  }
}