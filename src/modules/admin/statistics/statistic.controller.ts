import { Request, Response } from 'express';
import StatisticService from './statistic.service.js';

class statisticController {
    private statisticService = StatisticService;

    getStatistics = async (req: Request, res: Response) => {
        try {
            const statistics = await this.statisticService.getStatistics();
            res.status(200).json({
                status: 'success',
                data: statistics,
            });
        } catch (error: any) {
            console.error('Error retrieving statistics:', error);

            res.status(500).json({
                status: 'error',
                message: 'An error occurred while retrieving the statistics',
            });
        }
    };
}

export default new statisticController();
