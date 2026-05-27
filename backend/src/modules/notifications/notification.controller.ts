import { Request, Response } from 'express';
import NotificationService from './notification.service.js';
class NotificationController {
    private notificationService = NotificationService;
    getNotifications = async (req: Request, res: Response) => {
        const userId = req.user.sub as string;
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

    getNotificationById = async (req: Request, res: Response) => {
        const userId = req.user.sub as string;
        const notificationId = req.params.id as string;
        try {
            const notification =
                await this.notificationService.getNotificationById(
                    userId,
                    notificationId,
                );
            if (!notification) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Notification not found',
                });
            }
            res.status(200).json({
                status: 'success',
                data: notification,
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch notification',
            });
        }
    };

    getUnreadNotificationCount = async (req: Request, res: Response) => {
        const userId = req.user.sub as string;
        try {
            const count =
                await this.notificationService.getUnreadNotificationCount(
                    userId,
                );
            res.status(200).json({
                status: 'success',
                data: count,
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch unread notification count',
            });
        }
    };
}

export default new NotificationController();
