export interface JwtUser {
    sub: string;
    role: 'USER' | 'ADMIN';
    type: 'access' | 'refresh';
}
