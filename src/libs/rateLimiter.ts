import { createClient } from "redis"
import { rateLimit, type RateLimitRequestHandler, type Options } from "express-rate-limit"
import { RedisStore } from "rate-limit-redis"
import { Request } from "express"
import { errorResponser } from "./routeFunctions/responser"

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
    return `ip:${Array.isArray(ip) ? ip[0] : ip}`;
  }
}

export function createLimiter(
  windowMs: number = 60 * 1000,
  max: number = 1,
  type: LimiterType = "ip"
): RateLimitRequestHandler {
  const options: Partial<Options> = {
    store: new RedisStore({
      sendCommand: (...args: any[]) => redisClient.sendCommand(args),
      prefix: "saas:ratelimit:"
    }),
    legacyHeaders: false,
    standardHeaders: true,
    windowMs,
    max,
    keyGenerator: keyExtractors[type],
    handler: (_request, response) => errorResponser(response, {errorCode: "error.rateLimitExceeded", status: 429}),
    statusCode: 429
  }

  return rateLimit(options)
}