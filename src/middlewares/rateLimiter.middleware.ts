import { rateLimit } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis.js';
import { AppError } from '../errorhandler/appError.js';

export const studioRateLimiter = rateLimit({
    // Tell express-rate-limit to use our running Redis cluster
    store: new RedisStore({
        // @ts-ignore
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    }),
    windowMs: 60 * 60 * 1000, // ⏱️ Evaluation window: 1 hour
    max: 5, // 🛑 Allow a maximum of 5 generation requests per hour per user/IP
    handler: (req, res, next) => {
        next(new AppError('API Key quota protection triggered. Maximum 5 campaigns per hour allowed.', 429));
    }
});