import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const requireAuth = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const token = req.cookies?.accessToken;

    if (!token || typeof token !== 'string') {
        return res.status(401).json({
            status: 'fail',
            message: 'UNAUTHORIZED',
        });
    }

    if (!token.includes('.')) {
        return res.status(401).json({
            status: 'fail',
            message: 'MALFORMED_TOKEN',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
            issuer: process.env.JWT_ISSUER,
        }) as any;

        if (decoded.type && decoded.type !== 'access') {
            return res.status(401).json({
                status: 'fail',
                message: 'INVALID_TOKEN_TYPE',
            });
        }

        req.user = decoded;

        return next();
    } catch (error: any) {
        console.error(error);

        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                status: 'fail',
                message: 'ACCESS_TOKEN_EXPIRED',
            });
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                status: 'fail',
                message: 'INVALID_TOKEN',
            });
        }

        return res.status(401).json({
            status: 'fail',
            message: 'AUTH_FAILED',
        });
    }
};
