import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const requireAuth = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const token = req.cookies?.accessToken;

    if (!token || typeof token !== 'string') {
        return res.status(401).json({
            status: 'fail',
            message: 'Unauthorized',
        });
    }

    if (!token.includes('.')) {
        return res.status(401).json({
            status: 'fail',
            message: 'Malformed token',
        });
    }

    if (!token) {
        return res.status(401).json({
            status: 'fail',
            message: 'Unauthorized',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
            issuer: process.env.JWT_ISSUER,
        }) as any;

        if (decoded.type && decoded.type !== 'access') {
            return res.status(401).json({
                status: 'fail',
                message: 'Invalid token type',
            });
        }

        req.user = decoded;

        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({
            status: 'fail',
            message: 'Invalid token',
        });
    }
};
