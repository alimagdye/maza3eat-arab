import { Request, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const createLimiter = (
    max: number,
    message: string,
    paramKey?: string,
) =>
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max,

        keyGenerator: (req: Request, res: Response): string => {
            const baseKey = req.user?.sub
                ? `user-${req.user.sub}`
                : ipKeyGenerator(req.ip as string);

            if (paramKey) {
                const value = req.params[paramKey] || 'unknown';
                return `${baseKey}-${value}`;
            }

            return baseKey;
        },

        standardHeaders: true,
        legacyHeaders: false,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,

        message: {
            status: 'fail',
            message,
        },
    });

export const createIPLimiter = (max: number, message: string) =>
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
        message: {
            status: 'fail',
            message,
        },
    });
