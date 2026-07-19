import { createClient, type RedisClientType } from "redis"
import { times } from "./constants"

type EmailVerifierGetCommandReturn = {
  exists: true,
  email: string
} | {exists: false}

interface EmailVerifierSetCommandReturn {
  done: boolean
}

class RedisManager {
  private clientPromise: Promise<RedisClientType>
  private client: undefined | RedisClientType
  private readonly maxRetries = 20
  
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

  async emailVerifier(command: "set", {token, email}: {token: string, email: string}): Promise<EmailVerifierSetCommandReturn | false>
  async emailVerifier(command: "get", {token}: {token: string}): Promise<EmailVerifierGetCommandReturn | false>
  async emailVerifier(command: "get" | "set", {token, email}: {token: string, email: never | string}): Promise<EmailVerifierGetCommandReturn | EmailVerifierSetCommandReturn | false> {
    return await this.wrapper<EmailVerifierGetCommandReturn | EmailVerifierSetCommandReturn | false>(
      (error) => ({message: `error ${command}ting E-mail verifier for E-mail: ${email}, Token: ${token}. The error: \n ${error}`, return: false}),
      async (token, email) => {
        // Waiting for the client to fully load:
        await this.connect()

        if(!this.client) return false
        else {
          const key = `email_verification:token:${token}`
          switch(command) {
            case "get":
              const get_response = await this.client.get(key)
              if(!get_response) return {exists: false} as EmailVerifierGetCommandReturn
              else return {email: get_response, exists: true} as EmailVerifierGetCommandReturn
            case "set":
              const set_response = await this.client.set(key, email, {
                expiration: {
                  type: "PX",
                  value: times.minute * 15
                }
              })

              if(!set_response) return {done: false} as EmailVerifierSetCommandReturn
              else return {done: true} as EmailVerifierSetCommandReturn
            default:
              return false
          }
        }
      },
      token, email
    )
  }
}

const instance = new RedisManager()

export default instance