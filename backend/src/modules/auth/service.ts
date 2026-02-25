import authUtils from './utils.js';
import { prisma } from '../../prisma/client.js';
import crypto from 'crypto';

export default class AuthThirdPartyService {
    protected async findOrCreateUser(
        email: string,
        name: string,
        avatar: string,
        googleId: string,
    ) {
        return prisma.user.upsert({
            where: { googleId },
            update: {
                name,
                avatar,
                googleId,
            },
            create: {
                email,
                name,
                avatar,
                googleId,
            },
        });
    }

    protected async storeRefreshToken(userId: string, token: string) {
        const hash = crypto.createHash('sha256').update(token).digest('hex');

        const MAX_SESSIONS = 5;

        await prisma.$transaction(async (tx) => {
            const existingTokens = await tx.refreshToken.findMany({
                where: { userId },
                orderBy: { createdAt: 'asc' },
            });

            await tx.refreshToken.deleteMany({
                where: {
                    userId,
                    expiresAt: { lt: new Date() },
                },
            });

            if (existingTokens.length >= MAX_SESSIONS) {
                await tx.refreshToken.delete({
                    where: { id: existingTokens[0].id },
                });
            }

            await tx.refreshToken.create({
                data: {
                    token: hash,
                    userId,
                    expiresAt: new Date(
                        Date.now() +
                            Number(process.env.REFRESH_TOKEN_MAX_AGE) * 1000,
                    ),
                },
            });
        });
    }

    protected generateJwt(user: any) {
        const { accessToken } = authUtils.generateAccessToken(user);
        const { refreshToken } = authUtils.generateRefreshToken(user);

        return {
            data: {
                accessToken,
                refreshToken,
            },
        };
    }
}
