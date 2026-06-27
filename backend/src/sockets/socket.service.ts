import { getIO } from './socket.server.js';
import SOCKET_EVENTS from './socket.events.js';

class SocketService {
    emitNotificationCount(
        userId: string,
        unreadNotification: {
            total: { count: number; isCapped: boolean };
            notifications: { count: number; isCapped: boolean };
            contactRequests: { count: number; isCapped: boolean };
        },
    ) {
        const io = getIO();

        io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION_COUNT, {
            total: unreadNotification.total,
            notifications: unreadNotification.notifications,
            contactRequests: unreadNotification.contactRequests,
        });
    }
    emitForceLogout(userId: string, reason: string) {
        const io = getIO();

        io.to(`user:${userId}`).emit(SOCKET_EVENTS.FORCE_LOGOUT, {
            code: 'ACCOUNT_BANNED',
            message: `You have been banned due to ${reason}`,
        });
    }
}

export default new SocketService();
