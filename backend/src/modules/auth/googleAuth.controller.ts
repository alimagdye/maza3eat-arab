import { google } from 'googleapis';
import { randomBytes } from 'crypto';
import AuthService from './auth.service.js';
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
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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

        console.log('[AUTH] Google callback started', { code: code?.substring(0, 10), state: state?.substring(0, 10), hasStoredState: !!storedState });

        if (!code || !state) {
            console.error('[AUTH] Missing code or state');
            return res.redirect(`${process.env.FRONTEND_URL}?auth_error=missing_params`);
        }

        if (!storedState || state !== storedState) {
            console.error('[AUTH] State mismatch', { hasStoredState: !!storedState, stateMatch: state === storedState });
            return res.redirect(`${process.env.FRONTEND_URL}?auth_error=state_mismatch`);
        }

        try {
            console.log('[AUTH] Exchanging code for tokens...');
            const { tokens } = await this.oauth2Client.getToken(code);
            const { id_token } = tokens;
            if (!id_token) {
                console.error('[AUTH] Missing id_token in response');
                return res.redirect(`${process.env.FRONTEND_URL}?auth_error=no_id_token`);
            }

            console.log('[AUTH] Verifying ID token...');
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
                console.error('[AUTH] Email not verified', { email });
                return res.redirect(`${process.env.FRONTEND_URL}?auth_error=unverified_email`);
            }

            console.log('[AUTH] Creating or fetching user...', { email, name });
            const user = await this.authService.findOrCreateUser(
                email,
                name,
                avatar,
                googleId,
            );
            if (!user) {
                console.error('[AUTH] Failed to create/fetch user');
                return res.redirect(`${process.env.FRONTEND_URL}?auth_error=user_creation_failed`);
            }

            console.log('[AUTH] Generating JWT tokens...');
            const result = this.authService.generateJwt(user);
            if (!result.data.accessToken || !result.data.refreshToken) {
                console.error('[AUTH] Failed to generate JWT');
                return res.redirect(`${process.env.FRONTEND_URL}?auth_error=jwt_generation_failed`);
            }

            const { accessToken, refreshToken } = result.data;

            console.log('[AUTH] Storing refresh token...');
            await this.authService.storeRefreshToken(user.id, refreshToken);

            console.log('[AUTH] Setting cookies...');
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: Number(process.env.ACCESS_TOKEN_MAX_AGE) * 1000,
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: Number(process.env.REFRESH_TOKEN_MAX_AGE) * 1000,
            });

            // Clear OAuth state cookie now that authentication is complete
            res.clearCookie('oauth_state');

            console.log('[AUTH] OAuth successful, redirecting to', process.env.FRONTEND_URL);
            return res.redirect(process.env.FRONTEND_URL!);
        } catch (error) {
            console.error('[AUTH] OAuth callback error:', error);
            const errorMessage = error instanceof Error ? error.message : 'unknown_error';
            return res.redirect(`${process.env.FRONTEND_URL}?auth_error=${encodeURIComponent(errorMessage)}`);
        }
    };
}

export default new GoogleAuthController();
