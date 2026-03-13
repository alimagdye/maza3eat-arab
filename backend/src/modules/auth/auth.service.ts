import authUtils from './auth.utils.js';
import { prisma } from '../../prisma/client.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

class AuthService {
    private MAX_SESSIONS = 5;
    async findOrCreateUser(
        email: string,
        name: string,
        avatar: string,
        googleId: string,
    ) {
        return await prisma.user.upsert({
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

        await prisma.refreshToken.deleteMany({
            where: { token: hash },
        });
    }

    async rotateRefreshToken(oldToken: string) {
        let decoded: any;
        try {
            decoded = jwt.verify(
                oldToken,
                process.env.JWT_REFRESH_SECRET!,
            ) as any;
        } catch (error) {
            throw new Error('Invalid session');
        }

        const hash = this.hashToken(oldToken);

        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: hash },
        });

        if (!storedToken) {
            throw new Error('Invalid session');
        }

        if (storedToken.expiresAt < new Date()) {
            await prisma.refreshToken.delete({
                where: { id: storedToken.id },
            });
            throw new Error('Session expired');
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
        });

        if (!user) {
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

        if (!user) {
            return null;
        }

        return {
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            tier: user.tier,
        };
    }

    private hashToken(token: string) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
}

export default new AuthService();
