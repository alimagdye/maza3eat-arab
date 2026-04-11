import { Request, Response } from 'express';
import UserService from './user.service.js';

class UserController {
    private userService = UserService;

    me = async (req: any, res: Response) => {
        const user = await this.userService.getUserById(req.user.sub);

        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        return res.status(200).json({ status: 'success', data: user });
    };
}

export default new UserController();
