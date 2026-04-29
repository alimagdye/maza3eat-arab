import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { socketAuth } from './socket.auth.js';

let io: SocketIOServer;

export function initSocket(server: HTTPServer) {
    io = new SocketIOServer(server, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            credentials: true,
        },
    });

    io.use(socketAuth);

    io.on('connection', (socket) => {
        const userId = socket.data.user.sub;

        socket.join(`user:${userId}`);

        console.log(`Socket connected: ${socket.id}`);
        console.log(`Joined room user:${userId}`);

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
}

export function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }

    return io;
}
