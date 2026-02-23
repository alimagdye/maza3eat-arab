import { google } from 'googleapis';
import { AuthThirdPartyService } from './service.js';
class GoogleAuthController extends AuthThirdPartyService {
    constructor() {
        super();
        this.oauth2Client = new google.auth.OAuth2(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            'http://' +
                process.env.HOST +
                ':' +
                process.env.PORT +
                process.env.CALLBACK_URL,
        );
    }

    getAuthUrl = async (req: Request, res: Response) => {
        try {
            const url: string = this.oauth2Client.generateAuthUrl({
                access_type: 'offline',
                prompt: 'consent',
                scope: ['profile', 'email'],
            });
            return res.status(200).json({ status: 'success', data: { url } });
        } catch (err) {
            console.error(err);
            return res
                .status(500)
                .json({
                    status: 'error',
                    message: 'Failed to generate auth URL',
                });
        }
    };

    handleCallback = async (req: Request, res: Response) => {
        const code: string = req.query.code as string;
        if (!code)
            return res
                .status(400)
                .json({ status: 'fail', message: 'Missing code parameter' });

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

            const { email, name, sub: googleId } = ticket.getPayload();

            const user = await this.createOrFetchUser(
                email,
                name,
                googleId,
            );
            if (!user) {
                return res.status(500).json({
                    status: 'fail',
                    message: 'Failed to create or fetch user',
                });
            }

            const result = await this.generateJwt(user);
            if (result.status === 'fail')
                return res.status(400).json({
                    status: 'fail',
                    message: result.data?.message || 'Failed to generate JWT',
                });

            const accessToken = result.data.accessToken?.token;
            const refreshToken = result.data.refreshToken;
            const expiresIn = result.data.accessToken?.expiresIn;

            const redirectUrl = `${process.env.GOOGLE_REDIRECT_URL}?token=${encodeURIComponent(accessToken)}&expiresIn=${encodeURIComponent(expiresIn)}&refreshToken=${encodeURIComponent(refreshToken)}`;

            return res.redirect(redirectUrl);
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                status: 'error',
                message: 'Authentication failed',
            });
        }
    };
}

export const googleAuthController = new GoogleAuthController();
