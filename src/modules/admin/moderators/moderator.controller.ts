import { Request, Response } from 'express';
import moderatorService from './moderator.service.js';

class ModeratorController {
    private moderatorService = moderatorService;
    getModerators = async (req: Request, res: Response) => {
        const cursor = (req.query.cursor as string) || null;

        try {
            const result = await this.moderatorService.getModerators(cursor);

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            console.error('Error fetching moderators:', error);

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    promoteToModerator = async (req: Request, res: Response) => {
        const userId = req.params.userId as string;

        try {
            const user = await this.moderatorService.promoteToModerator(userId);

            return res.status(200).json({
                status: 'success',
                data: user,
            });
        } catch (error: any) {
            console.error('Error promoting user:', error);

            if (error.message === 'USER_ALREADY_PROMOTED') {
                return res.status(409).json({
                    status: 'fail',
                    data: { promoted: true },
                    message: 'User is already promoted',
                });
            }

            if (error.message === 'USER_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    data: { promoted: false },
                    message: 'User not found',
                });
            }

            if (error.message === 'CANNOT_PROMOTE_ADMIN') {
                return res.status(403).json({
                    status: 'fail',
                    data: { promoted: false },
                    message: 'Cannot promote admin, or developer user',
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    demoteModerator = async (req: Request, res: Response) => {
        const userId = req.params.userId as string;

        try {
            await this.moderatorService.demoteModerator(userId);

            return res.status(200).json({
                status: 'success',
                message: 'User demoted successfully',
            });
        } catch (error: any) {
            console.error('Error demoting user:', error);

            if (error.message === 'USER_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'User not found',
                });
            }

            if (error.message === 'USER_NOT_MODERATOR') {
                return res.status(409).json({
                    status: 'fail',
                    message: 'User is not a moderator',
                });
            }

            if (error.message === 'CANNOT_DEMOTE_ADMIN') {
                return res.status(403).json({
                    status: 'fail',
                    message: 'Cannot demote an admin or developer user',
                });
            }
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };
}

export default new ModeratorController();
