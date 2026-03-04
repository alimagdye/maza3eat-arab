import { google } from 'googleapis';
import { randomBytes } from 'crypto';
import AuthService from './service.js';
import { Request, Response } from 'express';

class GoogleAuthController {
    private oauth2Client: any;
    private authService = AuthService;
    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI,
        );
    }

    getAuthUrl = async (req: Request, res: Response) => {
        try {
            const state = randomBytes(32).toString('hex');
            const url: string = this.oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: ['profile', 'email', 'openid'],
                state,
            });

            res.cookie('oauth_state', state, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite:
                    process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 5 * 60 * 1000,
            });

            return res.status(200).json({ status: 'success', data: { url } });
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to generate auth URL',
            });
        }
    };

    handleCallback = async (req: Request, res: Response) => {
        const code: string = req.query.code as string;
        const state: string = req.query.state as string;
        const storedState: string = req.cookies.oauth_state;

        if (!code || !state) {
            return res.status(400).json({
                status: 'fail',
                message: 'Missing code or state',
            });
        }

        if (!storedState || state !== storedState) {
            return res.status(403).json({
                status: 'fail',
                message: 'Invalid OAuth state',
            });
        }

        res.clearCookie('oauth_state');

        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            const { id_token } = tokens;
            if (!id_token)
                return res.status(400).json({
                    status: 'fail',
                    message: 'Missing id_token in token response',
                });

            const ticket = await this.oauth2Client.verifyIdToken({
                idToken: id_token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const {
                email,
                email_verified,
                name,
                sub: googleId,
                picture: avatar,
            } = ticket.getPayload();

            if (!email_verified) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Email is not verified',
                });
            }

            const user = await this.authService.findOrCreateUser(
                email,
                name,
                avatar,
                googleId,
            );
            if (!user) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Failed to create or fetch user',
                });
            }

            const result = this.authService.generateJwt(user);
            if (!result.data.accessToken || !result.data.refreshToken)
                return res.status(400).json({
                    status: 'fail',
                    message: 'Failed to generate JWT',
                });

            const { accessToken, refreshToken } = result.data;

            await this.authService.storeRefreshToken(user.id, refreshToken);

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite:
                    process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: Number(process.env.ACCESS_TOKEN_MAX_AGE) * 1000,
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite:
                    process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: Number(process.env.REFRESH_TOKEN_MAX_AGE) * 1000,
            });

            return res.redirect(process.env.FRONTEND_URL!);
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                status: 'error',
                message: 'Authentication failed',
            });
        }
    };
}

export default new GoogleAuthController();
