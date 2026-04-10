import { Request, Response } from 'express';
import AdService from './ad.service.js';

class AdController {
    private adService = AdService;

    getPostAd = async (req: Request, res: Response) => {
        try {
            const data = await this.adService.getPostAd();

            res.json({
                status: 'success',
                data,
            });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    getHomeAds = async (req: Request, res: Response) => {
        try {
            const data = await this.adService.getHomeAds();

            res.json({
                status: 'success',
                data,
            });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };
}

export default new AdController();
