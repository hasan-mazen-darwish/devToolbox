export type ApiResponseErrorType = {
  error: true,
  errorCode: string
}

export type ApiResponseType = {
  error: false,
  data?: any
} | ApiResponseErrorType