import { Request, Response } from 'express';
import AnnouncementService from './announcement.service.js';

class AnnouncementController {
    private announcementService = AnnouncementService;

    createAnnouncement = async (req: Request, res: Response) => {
        const message: string = req.body.message;
        const userId: string = req.user.sub;

        try {
            const announcement =
                await this.announcementService.createAnnouncement(
                    message,
                    userId,
                );

            return res.status(201).json({
                status: 'success',
                data: announcement,
            });
        } catch (error: any) {
            console.error(error);

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    getAnnouncements = async (req: Request, res: Response) => {
        const cursor = req.query.cursor as string | null;

        try {
            const result =
                await this.announcementService.getAnnouncements(cursor);

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };
}

export default new AnnouncementController();
