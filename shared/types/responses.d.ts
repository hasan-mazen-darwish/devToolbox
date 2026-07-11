export type ApiResponseErrorType = {
  error: true,
  errorCode: string,
  data?: any
}

export type ApiResponseType = {data?: any} & {
  error: false,
} | ApiResponseErrorType