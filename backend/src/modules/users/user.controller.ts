import { Request, Response } from 'express';
import UserService from './user.service.js';

class UserController {
    private userService = UserService;

    me = async (req: Request, res: Response) => {
        try {
            const user = await this.userService.getUserById(req.user.sub, req.user.sub);

            if (!user) return res.status(401).json({ message: 'Unauthorized' });

            return res.status(200).json({ status: 'success', data: user });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    getUser = async (req: Request, res: Response) => {
        const userId = req.params.userId as string;
        const authUserId = req.user ? req.user.sub : null;

        try {
            const user = await this.userService.getUserById(userId, authUserId);

            if (!user)
                return res
                    .status(404)
                    .json({ status: 'fail', message: 'User not found' });

            return res.status(200).json({ status: 'success', data: user });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    userPosts = async (req: Request, res: Response) => {
        const userId = req.params.userId as string;
        const cursor = req.query.cursor as string | null;
        const authUserId = req.user ? req.user.sub : null;

        try {
            const result = await this.userService.getUserPosts(
                userId,
                cursor,
                authUserId,
            );

            return res.status(200).json({ status: 'success', data: result });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    userQuestions = async (req: Request, res: Response) => {
        const userId = req.params.userId as string;
        const cursor = req.query.cursor as string | null;
        const authUserId = req.user ? req.user.sub : null;

        try {
            const results = await this.userService.getUserQuestions(
                userId,
                cursor,
                authUserId,
            );

            return res.status(200).json({ status: 'success', data: results });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };
}

export default new UserController();
