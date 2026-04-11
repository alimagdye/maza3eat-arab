import { prisma } from '../../lib/client.js';

class UserService {
    async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
                avatar: true,
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
}

export default new UserService();
