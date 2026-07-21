import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { prisma } from './lib/client.js';
import { initSocket } from './sockets/socket.server.js';
import { getIO } from './sockets/socket.server.js';
// -----------------------------
// Initialize
// -----------------------------

const app: Application = express();
const server: http.Server = http.createServer(app);
const PORT: number = Number(process.env.PORT || '3000');
const NODE_ENV: string = process.env.NODE_ENV || 'development';

// -----------------------------
// Global Middlewares
// -----------------------------
import globalRateLimiter from './middlewares/rateLimit/globalRateLimiter.js';

app.set('trust proxy', 1);
app.use(helmet());
app.use(
    cors({
        origin: process.env.CLIENT_URL || '*',
        credentials: true,
    }),
);
app.use(globalRateLimiter);
app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));
app.use(
    express.urlencoded({
        extended: true,
        limit: '100kb',
    }),
);
app.use(compression());
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// -----------------------------
// Health Check
// -----------------------------

// app.get('/health', async (_req: Request, res: Response) => {
//     try {
//         await prisma.$queryRaw`SELECT 1`;
//         res.status(200).json({
//             status: 'ok',
//             database: 'connected',
//             timestamp: new Date(),
//         });
//     } catch (error) {
//         res.status(500).json({
//             status: 'error',
//             database: 'disconnected',
//         });
//     }
// });

// -----------------------------
// API Routes
// -----------------------------

import authRoutes from './modules/auth/auth.routes.js';
import postRoutes from './modules/posts/post.routes.js';
import commentReplyRoutes from './modules/commentReplies/reply.routes.js';
import commentLikeRoutes from './modules/postLikes/postLike.routes.js';
import tagRoutes from './modules/tags/tag.routes.js';
import questionRoutes from './modules/questions/question.routes.js';
import answerReplyRoutes from './modules/answerReplies/reply.routes.js';
import answerLikeRoutes from './modules/questionLikes/questionLike.routes.js';
import adRoutes from './modules/ads/ad.routes.js';
import userRoutes from './modules/users/user.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import contactRequestRoutes from './modules/contactRequests/contact.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1', commentReplyRoutes);
app.use('/api/v1', commentLikeRoutes);
app.use('/api/v1', tagRoutes);
app.use('/api/v1/questions', questionRoutes);
app.use('/api/v1', answerReplyRoutes);
app.use('/api/v1', answerLikeRoutes);
app.use('/api/v1/ads', adRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/contact-requests', contactRequestRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/admin', adminRoutes);

// -----------------------------
// 404 Handler
// -----------------------------

app.use((req: Request, res: Response) => {
    res.status(404).json({
        status: 'fail',
        message: `Route not found: ${req.originalUrl}`,
    });
});

// -----------------------------
// Global Error Handler
// -----------------------------

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('🔥 Global Error:', err);

    res.status(err.status || 500).json({
        status: 'error',
        message:
            NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    });
});

// -----------------------------
// Start Server
// -----------------------------

async function startServer() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected');

        initSocket(server);
        console.log('✅ WebSocket initialized');

        server.listen(PORT, () => {
            console.log(
                `🚀 Server running on http://localhost:${PORT} (${NODE_ENV})`,
            );
        });
    } catch (error) {
        console.error('❌ Failed to connect to database', error);
        process.exit(1);
    }
}

startServer();

// -----------------------------
// Graceful Shutdown
// -----------------------------

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received. Shutting down...');
    try {
        getIO().close();
    } catch {}
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received. Shutting down...');
    try {
        getIO().close();
    } catch {}
    await prisma.$disconnect();
    process.exit(0);
});
