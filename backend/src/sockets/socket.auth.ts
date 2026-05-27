import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import type { Socket } from 'socket.io';

export function socketAuth(socket: Socket, next: (err?: Error) => void) {
    const cookieHeader = socket.handshake.headers.cookie;

    if (!cookieHeader) {
        return next(new Error('UNAUTHORIZED'));
    }

    const cookies = cookie.parse(cookieHeader);

    const token = cookies.accessToken;

    if (!token || typeof token !== 'string') {
        return next(new Error('UNAUTHORIZED'));
    }

    if (!token.includes('.')) {
        return next(new Error('MALFORMED_TOKEN'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
            issuer: process.env.JWT_ISSUER,
        }) as any;

        if (decoded.type && decoded.type !== 'access') {
            return next(new Error('INVALID_TOKEN_TYPE'));
        }

        socket.data.user = decoded;

        return next();
    } catch (error) {
        console.error(error);

        if (error instanceof jwt.TokenExpiredError) {
            return next(new Error('ACCESS_TOKEN_EXPIRED'));
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return next(new Error('INVALID_TOKEN'));
        }

        return next(new Error('AUTH_FAILED'));
    }
}
