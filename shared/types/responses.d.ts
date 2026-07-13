export type ApiResponseErrorType<T = any> = {
  error: true,
  errorCode: string,
  data?: T
}

export type ApiResponseType<Y=any, T = any> = {data?: Y} & {
  error: false,
} | ApiResponseErrorType<T>

export interface ApiRateLimitData {
  remaining: number,
  unit: "millisecond" | "second" | "minute" | "hour" | "day" | "week" | "month" | "year"
}