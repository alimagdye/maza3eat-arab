import jwt, { SignOptions } from 'jsonwebtoken';
class AuthUtils {
    generateAccessToken(user: any) {
        const token = jwt.sign(
            {
                sub: user.id,
                role: user.role,
                tierId: user.tierId,
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: Number(process.env.ACCESS_TOKEN_MAX_AGE) * 1000,
                issuer: process.env.JWT_ISSUER,
            },
        );

        return {
            accessToken: token,
        };
    }

    generateRefreshToken(user: any) {
        const token = jwt.sign(
            { sub: user.id },
            process.env.JWT_REFRESH_SECRET!,
            {
                expiresIn: Number(process.env.REFRESH_TOKEN_MAX_AGE) * 1000,
                issuer: process.env.JWT_ISSUER,
            },
        );

        return {
            refreshToken: token,
        };
    }
}

export default new AuthUtils();
