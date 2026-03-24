import authUtils from './auth.utils.js';
import { prisma } from '../../prisma/client.js';
import { Prisma } from '@prisma/client';
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

    async storeRefreshToken(
        userId: string,
        token: string,
        tx?: Prisma.TransactionClient,
    ) {
        const db = tx ?? prisma;

        const hash = this.hashToken(token);

        const run = async (client: typeof db) => {
            // delete expired
            await client.refreshToken.deleteMany({
                where: {
                    userId,
                    expiresAt: { lt: new Date() },
                },
            });

            const existingTokens = await client.refreshToken.findMany({
                where: { userId },
                orderBy: { createdAt: 'asc' },
            });

            if (existingTokens.length >= this.MAX_SESSIONS) {
                await client.refreshToken.delete({
                    where: { id: existingTokens[0].id },
                });
            }

            await client.refreshToken.create({
                data: {
                    token: hash,
                    userId,
                    expiresAt: new Date(
                        Date.now() +
                            Number(process.env.REFRESH_TOKEN_MAX_AGE) * 1000,
                    ),
                },
            });
        };

        if (tx) {
            await run(db);
        } else {
            await prisma.$transaction(async (txClient) => {
                await run(txClient);
            });
        }
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

        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }

        const hash = this.hashToken(oldToken);

        const result = await prisma.$transaction(async (tx) => {
            const storedToken = await tx.refreshToken.findUnique({
                where: { token: hash },
            });

            if (!storedToken) {
                throw new Error('Invalid session');
            }

            if (storedToken.expiresAt < new Date()) {
                await tx.refreshToken.delete({
                    where: { id: storedToken.id },
                });

                throw new Error('Session expired');
            }

            const user = await tx.user.findUnique({
                where: { id: decoded.sub },
            });

            if (!user) {
                throw new Error('Unauthorized');
            }

            await tx.refreshToken.delete({
                where: { id: storedToken.id },
            });

            const { accessToken, refreshToken } = this.generateJwt(user).data;

            await this.storeRefreshToken(user.id, refreshToken, tx);

            return { accessToken, refreshToken };
        });

        return { data: result };
    }

    async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
                avatar: true,
                role: true,
                tier: {
                    select: {
                        name: true,
                        badgeColor: true,
                        description: true,
                    },
                },
            },
        });

        if (!user) {
            return null;
        }

        return user;
    }

    private hashToken(token: string) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
}

export default new AuthService();
