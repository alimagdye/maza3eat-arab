import { getIO } from './socket.server.js';
import SOCKET_EVENTS from './socket.events.js';

class SocketService {
    emitNotificationCount(
        userId: string,
        unreadNotification: { count: number; isCapped: boolean },
    ) {
        const io = getIO();

        io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION_COUNT, {
            count: unreadNotification.count,
            isCapped: unreadNotification.isCapped,
        });
    }
}

export default new SocketService();
