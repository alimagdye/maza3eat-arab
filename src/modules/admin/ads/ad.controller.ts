import { Request, Response } from 'express';
import AdService from './ad.service.js';
import imageUtils from '../../../utils/image.utils.js';

interface AdBody {
    title: string;
    text: string;
    buttonText: string;
    link: string;
    amountPaid: number;
    expireAt: Date;
}

class AdController {
    private adService = AdService;

    createAd = async (req: Request, res: Response) => {
        const { title, text, buttonText, link, amountPaid, expireAt } =
            req.body as AdBody;
        const userId = req.user.sub;

        const files = req.files as Express.Multer.File[];

        if (!files || files.length !== 1) {
            return res.status(400).json({
                status: 'fail',
                message: 'Exactly 1 image required',
            });
        }

        let uploads: {
            url: string;
            publicId: string;
            width: number;
            height: number;
            originalName: string;
        }[] = [];

        try {
            uploads = await Promise.all(
                files.map((file) =>
                    imageUtils.uploadBuffer(
                        file.buffer,
                        file.originalname,
                        'ads',
                    ),
                ),
            );

            const ad = await this.adService.createAd(userId, {
                title,
                text,
                link,
                buttonText,
                amountPaid,
                expireAt,
                uploads,
            });

            return res.status(201).json({
                status: 'success',
                data: ad,
            });
        } catch (error) {
            console.error('Error creating ad:', error);
            if (uploads.length > 0) {
                const publicIds = uploads.map((u) => u.publicId);

                await imageUtils
                    .deleteImages(publicIds)
                    .catch((cleanupError) => {
                        console.error(
                            'CRITICAL: Failed to clean up orphaned images',
                            cleanupError,
                        );
                    });
            }

            return res.status(500).json({
                status: 'error',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to create ad',
            });
        }
    };

    getAds = async (req: Request, res: Response) => {
        const sort: 'expireAt' | 'priority' =
            (req.query.sort as 'expireAt' | 'priority') || 'expireAt';
        const cursor: string | null = req.query.cursor as string | null;

        try {
            const ads = await this.adService.getAds(sort, cursor);
            return res.status(200).json({
                status: 'success',
                data: ads,
            });
        } catch (error) {
            console.error('Error fetching ads:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch ads',
            });
        }
    };

    updateAd = async (req: Request, res: Response) => {
        const adId: string = req.params.adId as string;
        const {
            title,
            text,
            buttonText,
            link,
            amountPaid,
            expireAt,
            isActive,
        } = req.body;

        const files = req.files as Express.Multer.File[];

        let uploads: {
            url: string;
            publicId: string;
            width: number;
            height: number;
            originalName: string;
        }[] = [];

        try {
            if (files && files.length > 0) {
                uploads = await Promise.all(
                    files.map((file) =>
                        imageUtils.uploadBuffer(
                            file.buffer,
                            file.originalname,
                            'ads',
                        ),
                    ),
                );
            }

            const ad = await this.adService.updateAd(adId, {
                title,
                text,
                buttonText,
                link,
                amountPaid,
                expireAt,
                isActive,
                uploads,
            });
            return res.status(200).json({
                status: 'success',
                data: ad,
            });
        } catch (error: any) {
            console.error('Error updating ad:', error);

            if (uploads.length > 0) {
                const publicIds = uploads.map((u) => u.publicId);

                await imageUtils
                    .deleteImages(publicIds)
                    .catch((cleanupError) => {
                        console.error(
                            'CRITICAL: Failed to clean up orphaned images',
                            cleanupError,
                        );
                    });
            }

            if (error.message === 'AD_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Ad not found',
                });
            }

            if (error.message === 'AD_ALREADY_EXISTS') {
                return res.status(409).json({
                    status: 'fail',
                    message: 'Ad with a same field already exists',
                });
            }

            return res.status(500).json({
                status: 'error',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to update ad',
            });
        }
    };

    deleteAd = async (req: Request, res: Response) => {
        const adId: string = req.params.adId as string;

        try {
            await this.adService.deleteAd(adId);
            return res.status(200).json({
                status: 'success',
                message: 'Ad deleted successfully',
            });
        } catch (error: any) {
            console.error('Error deleting ad:', error);

            if (error.message === 'AD_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Ad not found',
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Failed to delete ad',
            });
        }
    };
}

export default new AdController();
