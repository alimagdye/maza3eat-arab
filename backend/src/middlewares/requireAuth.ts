import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
// import { prisma } from '../prisma/client';

export const requireAuth = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const token = req.cookies.accessToken;

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

        // const user = await prisma.user.findUnique({
        //   where: { id: decoded.sub },
        // });
        // if (!user || user.isDeleted || user.isBanned) {
        //   return res.status(401).json({
        //     status: 'fail',
        //     message: 'Unauthorized',
        //   });
        // }
        // req.user = {
        //   sub: user.id,
        //   role: user.role,
        //   tierId: user.tierId,
        // };
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
