import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const optionalAuth = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const token = req.cookies?.accessToken;

    if (!token || typeof token !== 'string') {
        return next();
    }

    if (!token.includes('.')) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
            issuer: process.env.JWT_ISSUER,
        }) as any;

        if (decoded.type && decoded.type !== 'access') {
            return next();
        }

        req.user = decoded;

        return next();
    } catch (error: any) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                status: 'fail',
                message: 'ACCESS_TOKEN_EXPIRED',
            });
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return next();
        }

        return next();
    }
};
