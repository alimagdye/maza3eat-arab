const SOCKET_EVENTS = {
    NOTIFICATION_COUNT: 'notification:count',
    FORCE_LOGOUT: 'auth:force-logout',
    ANNOUNCEMENT_NOTIFICATION: 'notification:announcement',
} as const;

export default SOCKET_EVENTS;
