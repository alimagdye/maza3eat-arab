import { Request, Response } from 'express';
import UserAdminService from './user.service.js';

class UserAdminController {
    private userAdminService = UserAdminService;
    getUsers = async (req: Request, res: Response) => {
        const status: 'active' | 'banned' =
            (req.query.status as 'active' | 'banned') || 'banned';
        const cursor = (req.query.cursor as string) || null;

        try {
            const result = await this.userAdminService.getUsers(status, cursor);

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            console.error('Error fetching users:', error);

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    banUser = async (req: Request, res: Response) => {
        const userId = req.params.userId as string;
        const { reason } = req.body as { reason: string };
        const adminId = req.user.sub;

        try {
            const result = await this.userAdminService.banUser(
                userId,
                reason,
                adminId,
            );

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error: any) {
            console.error('Error banning user:', error);

            if (error.message === 'USER_ALREADY_BANNED') {
                return res.status(409).json({
                    status: 'fail',
                    data: { banned: true },
                    message: 'User is already banned',
                });
            }

            if (error.message === 'USER_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    data: { banned: false },
                    message: 'User not found',
                });
            }

            if (error.message === 'CANNOT_BAN_ADMIN') {
                return res.status(403).json({
                    status: 'fail',
                    data: { banned: false },
                    message: 'Cannot ban an admin user',
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    unbanUser = async (req: Request, res: Response) => {
        const userId = req.params.userId as string;

        try {
            await this.userAdminService.unbanUser(userId);

            return res.status(200).json({
                status: 'success',
                message: 'User unbanned successfully',
            });
        } catch (error: any) {
            console.error('Error unbanning user:', error);

            if (error.message === 'USER_NOT_BANNED') {
                return res.status(400).json({
                    status: 'fail',
                    message: 'User is already not banned or not found',
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    updateUserTier = async (req: Request, res: Response) => {
        const userId = req.params.userId as string;
        const tierId = req.body.tierId as number;

        try {
            const result = await this.userAdminService.updateUserTier(
                userId,
                tierId,
            );

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error: any) {
            console.error('Error updating user tier:', error);

            if (error.message === 'USER_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'User not found',
                });
            }

            if (error.message === 'TIER_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Tier not found',
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };
}

export default new UserAdminController();
