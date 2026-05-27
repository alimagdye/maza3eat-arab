import { Request, Response, CookieOptions } from 'express';
import AuthService from './auth.service.js';

class AuthController {
    private authService = AuthService;

    // Define class properties
    private readonly isProduction: boolean;
    private readonly accessTokenMaxAge: number;
    private readonly refreshTokenMaxAge: number;
    private readonly baseCookieOptions: CookieOptions;

    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';

        const accessStr = process.env.ACCESS_TOKEN_MAX_AGE;
        const refreshStr = process.env.REFRESH_TOKEN_MAX_AGE;

        // Fail fast if missing or invalid
        if (!accessStr || isNaN(Number(accessStr))) {
            throw new Error(
                'FATAL: ACCESS_TOKEN_MAX_AGE must be a valid number in env.',
            );
        }
        if (!refreshStr || isNaN(Number(refreshStr))) {
            throw new Error(
                'FATAL: REFRESH_TOKEN_MAX_AGE must be a valid number in env.',
            );
        }

        // Pre-calculate max ages in milliseconds
        this.accessTokenMaxAge = Number(accessStr) * 1000;
        this.refreshTokenMaxAge = Number(refreshStr) * 1000;

        // Define base cookie options once
        this.baseCookieOptions = {
            httpOnly: true,
            secure: this.isProduction,
            sameSite: this.isProduction ? 'none' : 'lax',
            path: '/',
        };
    }

    logout = async (req: Request, res: Response) => {
        const refreshToken = req.cookies?.refreshToken;

        try {
            if (refreshToken) {
                await this.authService.deleteRefreshToken(refreshToken);
            }
        } catch (error) {
            console.error('Logout error:', error);
        }

        // Reuse the base options
        res.clearCookie('accessToken', this.baseCookieOptions);
        res.clearCookie('refreshToken', this.baseCookieOptions);

        return res.status(200).json({ status: 'success' });
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

            // Spread the base options and add the specific maxAge
            res.cookie('accessToken', tokens.data.accessToken, {
                ...this.baseCookieOptions,
                maxAge: this.accessTokenMaxAge,
            });

            res.cookie('refreshToken', tokens.data.refreshToken, {
                ...this.baseCookieOptions,
                maxAge: this.refreshTokenMaxAge,
            });

            return res.status(200).json({ status: 'success' });
        } catch (error: any) {
            console.error('Refresh error:', error);

            if (
                error.message === 'REFRESH_TOKEN_EXPIRED' ||
                error.message === 'SESSION_NOT_FOUND' ||
                error.message === 'INVALID_REFRESH_TOKEN' ||
                error.message === 'INVALID_TOKEN_TYPE' ||
                error.message === 'UNAUTHORIZED'
            ) {
                res.clearCookie('accessToken', this.baseCookieOptions);
                res.clearCookie('refreshToken', this.baseCookieOptions);

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
