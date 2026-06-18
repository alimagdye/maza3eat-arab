import { Request, Response } from 'express';
import HomeAdService from './homeAd.service.js';
import { Prisma } from '@prisma/client';

class HomeAdController {
    private homeAdService = HomeAdService;

    createHomeAd = async (req: Request, res: Response) => {
        const { adId, adPosition } = req.body;

        try {
            const ad = await this.homeAdService.createHomeAd(adId, adPosition);

            return res.status(201).json({
                status: 'success',
                data: ad,
            });
        } catch (error) {
            console.error('Error creating home ad:', error);

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    return res.status(409).json({
                        status: 'fail',
                        message: 'This home ad position is already occupied',
                    });
                }

                if (error.code === 'P2003' || error.code === 'P2025') {
                    return res.status(404).json({
                        status: 'fail',
                        message: 'Ad not found',
                    });
                }
            }

            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch home ads',
            });
        }
    };

    getHomeAds = async (req: Request, res: Response) => {
        try {
            const ads = await this.homeAdService.getHomeAds();
            return res.status(200).json({
                status: 'success',
                data: ads,
            });
        } catch (error) {
            console.error('Error fetching ads:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch home ads',
            });
        }
    };

    updateHomeAd = async (req: Request, res: Response) => {
        const homeAdId: string = req.params.homeAdId as string;
        const { adId } = req.body;

        try {
            const ad = await this.homeAdService.updateHomeAd(homeAdId, adId);

            return res.status(200).json({
                status: 'success',
                data: ad,
            });
        } catch (error: any) {
            console.error('Error updating home ad:', error);

            if (error.message === 'HOME_AD_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Home ad not found',
                });
            }

            if (error.message === 'AD_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Ad not found',
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Failed to update home ad',
            });
        }
    };

    deleteHomeAd = async (req: Request, res: Response) => {
        const homeAdId: string = req.params.homeAdId as string;

        try {
            await this.homeAdService.deleteHomeAd(homeAdId);
            return res.status(200).json({
                status: 'success',
                message: 'Home ad deleted successfully',
            });
        } catch (error: any) {
            console.error('Error deleting home ad:', error);

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2003' || error.code === 'P2025') {
                    return res.status(404).json({
                        status: 'fail',
                        message: 'Home ad not found',
                    });
                }
            }

            return res.status(500).json({
                status: 'error',
                message: 'Failed to delete home ad',
            });
        }
    };
}

export default new HomeAdController();
