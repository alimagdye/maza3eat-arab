import { Request, Response } from 'express';
import NotificationService from './notification.service.js';
class NotificationController {
    private notificationService = NotificationService;
    getNotifications = async (req: Request, res: Response) => {
        const userId = req.user.sub;
        const cursor = req.query.cursor as string | null;
        try {
            const notifications =
                await this.notificationService.getNotifications(userId, cursor);
            res.status(200).json({
                status: 'success',
                data: notifications,
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch notifications',
            });
        }
    };
}

export default new NotificationController();
