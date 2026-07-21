import 'express-serve-static-core';
import { JwtUser } from './auth.ts';

declare module 'express-serve-static-core' {
    interface Request {
        user: JwtUser;
    }
}
