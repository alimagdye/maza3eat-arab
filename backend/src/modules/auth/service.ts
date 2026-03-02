import authUtils from './utils.js';
import { prisma } from '../../prisma/client.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export default class AuthService {
    private MAX_SESSIONS = 5;
    async findOrCreateUser(
        email: string,
        name: string,
        avatar: string,
        googleId: string,
    ) {
        return prisma.user.upsert({
            where: { email },
            update: {
                name,
                avatar,
            },
            create: {
                email,
                name,
                avatar,
                googleId,
            },
        });
    }

    generateJwt(user: any) {
        const { accessToken } = authUtils.generateAccessToken(user);
        const { refreshToken } = authUtils.generateRefreshToken(user);

        return { data: { accessToken, refreshToken } };
    }

    async storeRefreshToken(userId: string, token: string) {
        const hash = this.hashToken(token);

        await prisma.$transaction(async (tx) => {
            // delete expired
            await tx.refreshToken.deleteMany({
                where: {
                    userId,
                    expiresAt: { lt: new Date() },
                },
            });

            const existingTokens = await tx.refreshToken.findMany({
                where: { userId },
                orderBy: { createdAt: 'asc' },
            });

            if (existingTokens.length >= this.MAX_SESSIONS) {
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

    async deleteRefreshToken(token: string) {
        const hash = this.hashToken(token);

        const deleted = await prisma.refreshToken.delete({
            where: { token: hash },
        });
        return deleted;
    }

    async rotateRefreshToken(oldToken: string) {
        const decoded = jwt.verify(
            oldToken,
            process.env.JWT_REFRESH_SECRET!,
        ) as any;

        const hash = this.hashToken(oldToken);

        const storedToken = await prisma.refreshToken.findFirst({
            where: { token: hash },
        });

        if (!storedToken) {
            throw new Error('Invalid session');
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
        });

        if (!user || user.isBanned) {
            throw new Error('Unauthorized');
        }

        // delete old token (rotation)
        await prisma.refreshToken.delete({
            where: { id: storedToken.id },
        });

        const { accessToken, refreshToken } = this.generateJwt(user).data;

        await this.storeRefreshToken(user.id, refreshToken);

        return { data: { accessToken, refreshToken } };
    }

    async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { tier: true },
        });

        if (!user || user.isDeleted || user.isBanned) {
            return null;
        }

        return {
            name: user.name,
            email: user.email,
            role: user.role,
            tier: user.tier,
        };
    }

    private hashToken(token: string) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
}
