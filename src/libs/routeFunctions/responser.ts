import type { Response } from "express"
import type { ApiResponseErrorType, ApiResponseType } from "../../../shared/types/responses";

type ResponserConfig<T=any, Y=any> = ApiResponseType<T, Y> & {
  status: number
}

type ErrorResponserConfig<T=any> = Omit<ApiResponseErrorType<T>, 'error'> & {status: number}
type ReturnTypeInFunctions = Promise<Response>

export async function responser<T=any, Y=any>(res: Response, config: ResponserConfig<T, Y> = {
  error: false,
  status: 200
}): ReturnTypeInFunctions {
  const returnData: ApiResponseType<T, Y> = config.error ? 
  {error: true, errorCode: (config as ApiResponseErrorType<T>).errorCode, data: config.data}
  : {error: false, data: config.data}

  return res.status(config.status).json(returnData)
}

export async function invalidInputResponser<T=any>(res: Response, config: Omit<ErrorResponserConfig<T>, 'status'> = {errorCode: ""}): ReturnTypeInFunctions {
  return responser(res, {
    error: true,
    errorCode: config.errorCode,
    status: 400,
    data: config.data
  })
}

export async function errorResponser<T=any>(res: Response, config: ErrorResponserConfig<T> = {errorCode: "", status: 400}): ReturnTypeInFunctions {
  return responser(res, {
    error: true,
    errorCode: config.errorCode,
    status: config.status,
    data: config.data
  })
}

export async function internalServerError(res: Response): ReturnTypeInFunctions {
  return errorResponser(res, {
    errorCode: "internalServerError",
    status: 500
  })
}