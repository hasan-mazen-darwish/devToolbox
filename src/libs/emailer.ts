import dotenv from "dotenv"
import Crypto from "crypto"

dotenv.config()

interface SendEmailReturnType {
  success: boolean,
  message: string,
  data: {
    reference_id: string
  }
}

interface MailerooEmailObject {
  address: string;
  display_name?: string;
}

interface MarilerooAttachmentObject {
  file_name: string;
  content_type?: string;
  content: string;
  inline?: boolean;
}

type MailerooRecepients = MailerooEmailObject | MailerooEmailObject[]

interface MailerooRequestBody {
  from: MailerooEmailObject;
  to: MailerooRecepients;
  cc?: MailerooRecepients;
  bcc?: MailerooRecepients;
  reply_to?: MailerooRecepients;
  subject: string;
  html?: string;
  plain?: string;
  tracking?: boolean;
  tags?: Map<string, string>;
  headers?: Map<string, string>;
  attachments?: MarilerooAttachmentObject[];
  scheduled_at?: string;
  reference_id?: string;
}

export default async function sendEmail(to: string, html: string, subject: string = "Email Verification", display_name?: string): Promise<SendEmailReturnType | null> {
  try {
    const apiKey = process.env.MAILEROO_SENDING_KEY!
    const reference_id = Crypto.randomBytes(12).toString("hex")

    const response = await fetch("https://smtp.maileroo.com/api/v2/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Maileroo-Ref-ID": reference_id
      },
      body: JSON.stringify({
        from: {
          address: "emailverifier@427fbaa5236497a7.maileroo.org",
          display_name: "DevToolbox E-mail Verifier"
        },
        to: {
          address: to,
          display_name
        },
        subject: subject,
        html,
        reference_id
      } as MailerooRequestBody)
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