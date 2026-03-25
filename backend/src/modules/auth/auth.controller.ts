import { Request, Response } from 'express';
import AuthService from './auth.service.js';

class AuthController {
    private authService = AuthService;

    me = async (req: any, res: Response) => {
        const user = await this.authService.getUserById(req.user.sub);

        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        return res.status(200).json({ status: 'success', data: user });
    };

    logout = async (req: Request, res: Response) => {
        const refreshToken = req.cookies?.refreshToken;

        try {
            if (refreshToken) {
                await this.authService.deleteRefreshToken(refreshToken);
            }
        } catch (error) {
            console.error('Logout error:', error);
        }

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        } as const;

        res.clearCookie('accessToken', cookieOptions);
        res.clearCookie('refreshToken', cookieOptions);

        return res.status(200).json({
            status: 'success',
        });
    };

    refresh = async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                status: 'fail',
                message: 'NO_REFRESH_TOKEN',
            });
        }

        try {
            const tokens =
                await this.authService.rotateRefreshToken(refreshToken);

            res.cookie('accessToken', tokens.data.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite:
                    process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: Number(process.env.ACCESS_TOKEN_MAX_AGE) * 1000,
            });

            res.cookie('refreshToken', tokens.data.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite:
                    process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: Number(process.env.REFRESH_TOKEN_MAX_AGE) * 1000,
            });

            return res.status(200).json({
                status: 'success',
            });
        } catch (error: any) {
            console.error('Refresh error:', error);

            if (
                error.message === 'REFRESH_TOKEN_EXPIRED' ||
                error.message === 'SESSION_NOT_FOUND' ||
                error.message === 'INVALID_REFRESH_TOKEN' ||
                error.message === 'INVALID_TOKEN_TYPE' ||
                error.message === 'UNAUTHORIZED'
            ) {
                return res.status(401).json({
                    status: 'fail',
                    message: error.message,
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };
}

export default new AuthController();
