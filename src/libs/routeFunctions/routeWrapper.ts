import type { Response, Request } from "express"
import { internalServerError } from "./responser"

export default async function routeFunctionWrapper<T extends (...args: any[]) => Promise<any>>(f: T, req: Request, res: Response, errorMessage: string = "") {
  try {
    const result = await f(req, res)
    return result
  } catch(error) {
    console.error(errorMessage, error)
    return internalServerError(res)
  }
}