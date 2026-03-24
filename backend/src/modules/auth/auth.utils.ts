import jwt from 'jsonwebtoken';
class AuthUtils {
    generateAccessToken(user: any) {
        const token = jwt.sign(
            {
                sub: user.id,
                role: user.role,
                type: 'access',
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: Number(process.env.ACCESS_TOKEN_MAX_AGE),
                issuer: process.env.JWT_ISSUER,
            },
        );

        return {
            accessToken: token,
        };
    }

    generateRefreshToken(user: any) {
        const token = jwt.sign(
            { sub: user.id, type: 'refresh' },
            process.env.JWT_REFRESH_SECRET!,
            {
                expiresIn: Number(process.env.REFRESH_TOKEN_MAX_AGE),
                issuer: process.env.JWT_ISSUER,
            },
        );

        return {
            refreshToken: token,
        };
    }
}

export default new AuthUtils();
