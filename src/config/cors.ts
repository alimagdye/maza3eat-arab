import { CorsOptions } from 'cors';

if (!process.env.CLIENT_URL) {
    console.error(
        '❌ FATAL: CLIENT_URL is not set. Credentialed CORS requires one or more explicit origins.',
    );
    process.exit(1);
}

const allowedOrigins = process.env.CLIENT_URL.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const corsOptions: CorsOptions = {
    credentials: true,
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
};
