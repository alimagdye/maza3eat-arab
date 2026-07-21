export interface JwtUser {
    sub: string;
    role: 'USER' | 'ADMIN' | 'MODERATOR';
    type: 'access' | 'refresh';
}
