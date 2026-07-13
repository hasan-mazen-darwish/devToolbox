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
      const unit: ApiRateLimitData["unit"] = Math.round(remaining/times.minute) ? "minute"
                                           : Math.round(remaining/times.second) ? "second"
                                           : "millisecond"
      return errorResponser<ApiRateLimitData>(response, {errorCode: "error.rateLimitExceeded", status: 429, data: {
        remaining,
        unit
      }})
    },
    statusCode: 429
  }

  return rateLimit(options)
}