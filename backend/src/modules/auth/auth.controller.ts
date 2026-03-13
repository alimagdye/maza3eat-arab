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
        const refreshToken = req.cookies.refreshToken;
        console.log(refreshToken);
        if (!refreshToken)
            return res.status(400).json({ message: 'No refresh token' });

        await this.authService.deleteRefreshToken(refreshToken);

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        return res.status(200).json({ status: 'success' });
    };

    refresh = async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken)
            return res.status(401).json({ message: 'Unauthorized' });

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

            return res.status(200).json({ status: 'success' });
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Invalid session' });
        }
    };
}

export default new AuthController();
