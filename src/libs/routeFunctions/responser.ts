import type { Response } from "express"
import type { ApiResponseErrorType, ApiResponseType } from "../../../shared/types/responses";

type ResponserConfig = ApiResponseType & {
  status: number
}

type ErrorResponserConfig = Omit<ApiResponseErrorType, 'error'> & {status: number}
type ReturnTypeInFunctions = Promise<Response>

export async function responser(res: Response, config: ResponserConfig = {
  error: false,
  status: 200
}): ReturnTypeInFunctions {
  const returnData: ApiResponseType = config.error ? 
  {error: true, errorCode: (config as ApiResponseErrorType).errorCode}
  : {error: false, data: config.data}

  return res.status(config.status).json(returnData)
}

export async function errorResponser(res: Response, config: ErrorResponserConfig = {errorCode: "", status: 400}): ReturnTypeInFunctions {
  return responser(res, {
    error: true,
    errorCode: config.errorCode,
    status: config.status
  })
}

export async function internalServerError(res: Response): ReturnTypeInFunctions {
  return errorResponser(res, {
    errorCode: "internalServerError",
    status: 500
  })
}