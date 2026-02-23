import { PrismaClient } from '@prisma/client';
import authService from '../services/authService.js';
const prisma = new PrismaClient();

export class AuthThirdPartyService {
    async createOrFetchUser(email: string, name: string, googleId: string) {
        let user = await prisma.user.findUnique({
            where: { email },
        });
        if (user) {
            user = await prisma.user.update({
                where: { email },
                data: {
                    googleId,
                    name,
                },
            });
        }
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    googleId,
                },
            });
        }
        return user;
    }

    async generateJwt(user) {
        const { accessToken, type, expiresIn } =
            authService.generateAccessToken(user);
        const [refreshToken] = await Promise.all([
            authService.generateRefreshToken(user),
            authService.sendOtpMail(user, true),
        ]);

        return {
            data: {
                accessToken: {
                    token: accessToken,
                    type: type,
                    expiresIn: expiresIn,
                },
                refreshToken: refreshToken,
            },
        };
    }
}
