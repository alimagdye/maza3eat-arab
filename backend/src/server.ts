import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { prisma } from './prisma/client.js';
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
import globalRateLimiter from './middlewares/globalRateLimiter.js';

app.use(helmet());

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
    cors({
        origin: process.env.CLIENT_URL || '*',
        credentials: true,
    }),
);
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(globalRateLimiter);

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
import replyRoutes from './modules/replies/reply.routes.js';
import likeRoutes from './modules/likes/like.routes.js';
import tagRoutes from './modules/tags/tag.routes.js';
// import questionRoutes from "./modules/questions/routes";
// import userRoutes from "./modules/users/routes";
// import reportRoutes from "./modules/reports/routes";
// import contactRoutes from "./modules/contact/routes";
// import notificationRoutes from "./modules/notifications/routes";
// import adRoutes from "./modules/ads/routes";
// import adminRoutes from "./modules/admin/routes";

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1', replyRoutes);
app.use('/api/v1', likeRoutes);
app.use('/api/v1', tagRoutes);
// app.use("/api/v1/home", homeRoutes);
// app.use("/api/v1/questions", questionRoutes);
// app.use("/api/v1/users", userRoutes);
// app.use("/api/v1/reports", reportRoutes);
// app.use("/api/v1/contact-requests", contactRoutes);
// app.use("/api/v1/notifications", notificationRoutes);
// app.use("/api/v1/ads", adRoutes);
// app.use("/api/v1/admin", adminRoutes);

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
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received. Shutting down...');
    await prisma.$disconnect();
    process.exit(0);
});
