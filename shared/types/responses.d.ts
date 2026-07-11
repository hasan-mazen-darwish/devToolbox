export type ApiResponseErrorType = {
  error: true,
  errorCode: string,
  data?: any
}

export type ApiResponseType = {
  error: false,
  data?: any
} | ApiResponseErrorType