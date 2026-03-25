import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const optionalAuth = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const token = req.cookies?.accessToken;

    if (!token || typeof token !== 'string') {
        return next(); // guest
    }

    if (!token.includes('.')) {
        return next(); // malformed -> ignore
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
            issuer: process.env.JWT_ISSUER,
        }) as any;

        if (decoded.type && decoded.type !== 'access') {
            return next();
        }

        req.user = decoded;
    } catch (error) {
        // ignore invalid token
    }

    next();
};
