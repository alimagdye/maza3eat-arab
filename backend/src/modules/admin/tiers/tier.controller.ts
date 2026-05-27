import { Request, Response } from 'express';
import TierService from './tier.service.js';

class TierController {
    private tierService = TierService;

    getTiers = async (req: Request, res: Response) => {
        try {
            const tiers = await this.tierService.getTiers();

            return res.status(200).json({
                status: 'success',
                data: tiers,
            });
        } catch (error) {
            console.error('Get tiers error:', error);

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    updateTier = async (req: Request, res: Response) => {
        const tierId = Number(req.params.tierId);

        const { name, description, badgeColor } = req.body as {
            name: string;
            description: string;
            badgeColor: string;
        };

        try {
            const tier = await this.tierService.updateTier(
                tierId,
                name,
                description,
                badgeColor,
            );

            return res.status(200).json({
                status: 'success',
                data: tier,
            });
        } catch (error: any) {
            console.error('Update tier error:', error);

            if (error.message === 'TIER_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Tier not found',
                });
            }

            if (error.message === 'TIER_ALREADY_EXISTS') {
                return res.status(409).json({
                    status: 'fail',
                    message: 'Tier name or badge color already exists',
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };
}

export default new TierController();
