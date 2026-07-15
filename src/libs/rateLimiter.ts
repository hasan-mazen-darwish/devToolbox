import { createClient } from "redis"
import { rateLimit, type RateLimitRequestHandler, type Options, type AugmentedRequest, ipKeyGenerator } from "express-rate-limit"
import { RedisStore } from "rate-limit-redis"
import { Request } from "express"
import { errorResponser } from "./routeFunctions/responser"
import type { ApiRateLimitData } from "../../shared/types/responses"
import { times } from "./constants"

const redisClient = createClient()
await redisClient.connect()

type LimiterType = "email" | "ip" | "api-key"

const keyExtractors = {
  "email": (req: Request) => {
    const email = req.body.email || req.query.email;
    if (!email) throw new Error("Email required for rate limiting");
    return `email:${email}`;
  },
  "api-key": (req: Request) => {
    const key = req.headers["x-api-key"] || req.headers["authorization"];
    if (!key) throw new Error("API key required for rate limiting");
    // Remove "Bearer " prefix if using auth header
    const cleanKey = typeof key === "string" ? key.replace(/^Bearer\s+/, "") : key;
    return `apikey:${cleanKey}`;
  },
  "ip": (req: Request) => {
    const ip = req.headers["x-forwarded-for"] || req.ip || req.socket.remoteAddress;
    const ipString:string = Array.isArray(ip) ? ip[0] : ip!
    return `ip:${ipKeyGenerator(ipString)}`;
  }
}

function getTimeWithUnit(time: number): ApiRateLimitData {
  if(Math.floor(time/times.year) >= 1) return {remaining: Math.floor(time/times.year), unit: "year"}
  else if(Math.floor(time/times.month) >= 1) return {remaining: Math.floor(time/times.month), unit: "month"}
  else if(Math.floor(time/times.week) >= 1) return {remaining: Math.floor(time/times.week), unit: "week"}
  else if(Math.floor(time/times.day) >= 1) return {remaining: Math.floor(time/times.day), unit: "day"}
  else if(Math.floor(time/times.hour) >= 1) return {remaining: Math.floor(time/times.hour), unit: "hour"}
  else if(Math.floor(time/times.minute) >= 1) return {remaining: Math.floor(time/times.minute), unit: "minute"}
  else if(Math.floor(time/times.second) >= 1) return {remaining: Math.floor(time/times.second), unit: "second"}
  else return {remaining: time, unit: "millisecond"}
}

export function createLimiter(
  windowMs: number = 60 * 1000,
  max: number = 1,
  type: LimiterType = "ip",
  scope: string = "cooldown"
): RateLimitRequestHandler {
  const options: Partial<Options> = {
    store: new RedisStore({
      sendCommand: (...args: any[]) => redisClient.sendCommand(args),
      prefix: `saas:ratelimit:${scope}`
    }),
    legacyHeaders: false,
    standardHeaders: true,
    windowMs,
    max,
    keyGenerator: keyExtractors[type],
    handler: (request, response) => {
      const { resetTime } = (request as AugmentedRequest).rateLimit
      const now = Date.now()
      const remaining = (resetTime?.getTime() || now) - now
      return errorResponser<ApiRateLimitData>(response, {errorCode: "rateLimitExceeded", status: 429, data: getTimeWithUnit(remaining)})
    },
    statusCode: 429
  }

  return rateLimit(options)
}