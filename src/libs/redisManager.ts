import { createClient, type SetOptions, type RedisClientType } from "redis"
import { times } from "./constants"
import Crypto from "crypto"

type EmailVerifierReturn = {
  exists: true,
  email: string
} | {exists: false}

interface EmailSetterReturn {
  done: boolean
}

class RedisManager {
  private clientPromise: Promise<RedisClientType>
  private client: undefined | RedisClientType
  private readonly maxRetries = 20
  private readonly tokenKeyBase = "email_verification:token:"
  private readonly emailKeyBase = "email_verification:email:"
  
  constructor() {
    this.clientPromise = this.returnClientPromise()
  }

  private async returnClientPromise(): Promise<RedisClientType> {
    return createClient({disableOfflineQueue: true, socket: {reconnectStrategy: (retries) => retries > this.maxRetries ? false : Math.min(retries*100, times.second*3)}})
            .on("error", error => console.error(error))
            .connect()
  }

  private async wrapper<T = any>(errorMessager: (error: any) => {message: string, return: T}, callback: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
    try {
      const returning = await callback(...args)
      return returning
    } catch(error) {
      const obj = errorMessager(error)
      console.error(obj.message)
      return obj.return
    }
  }


  async connect(): Promise<boolean> {
    return await this.wrapper<boolean>(error => ({message: `Error creating Redis Client, ${error}`, return: false}), async () => {
      if(!this.client) {
        this.client = await this.clientPromise
      }
      
      return true
    })
  }

  async disconnect(): Promise<boolean> {
    return await this.wrapper<boolean>((error) => ({message: `Error destrtying the Redis client, ${error}`, return: false}), async () => {
      if(!this.client) return true
      else {
        await this.client.quit()
        this.client = undefined
        return true
      }
    })
  }

  async emailVerifier(token: string): Promise<EmailVerifierReturn | false> {
    return await this.wrapper<EmailVerifierReturn | false>(
      error => ({message: `Error getting the E-mail from token (${token}): ${error}\n`, return: false}),
      async (token) => {
        // Waiting for the client to fully load:
        await this.connect()
        if(!this.client) return false
        else {
          const key = this.tokenKeyBase + token

          const response = await this.client.get(key)
          if(!response) return {exists: false}
          else {
            const email = response
            const emailResponse = await this.client.get(this.emailKeyBase + email)
            if(!emailResponse) return false
            else {
              if(Crypto.timingSafeEqual(Buffer.from(token), Buffer.from(emailResponse))) return {email, exists: true}
              else return false
            }
          }
        }
      },
      token
    )
  }

  async emailSetter(email: string, token: string): Promise<EmailSetterReturn | false> {
    return await this.wrapper<EmailSetterReturn | false>(
      error => ({message: `Error setting the E-mail ${email} for token (${token}): ${error}\n`, return: false}),
      async (email: string, token: string) => {
        // Waiting for the client to be fully loaded:
        await this.connect()

        if(!this.client) return false
        else {
          const emailToTokenKey = this.emailKeyBase + email
          const tokenToEmailKey = this.tokenKeyBase + token
          const expiration: SetOptions["expiration"] = {
            type: "PX",
            value: times.minute * 15
          }

          const setEmailResponse = await this.client.set(emailToTokenKey, token, {expiration})
          if(!setEmailResponse) return false

          const setTokenResponse = await this.client.set(tokenToEmailKey, email, {expiration})
          if(!setTokenResponse) return false

          return {done: true}
        }
      },
      email, token
    )
  }
}

const instance = new RedisManager()

export default instance