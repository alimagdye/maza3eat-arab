import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const requireAuth = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const token: string = req.cookies.accessToken;
    if (!token)
        return res.status(401).json({
            status: 'fail',
            message: 'Unauthorized',
        });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
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
