import { Request, Response } from 'express';
import ReportService from './report.service.js';
import { Prisma } from '@prisma/client';

class ReportController {
    private reportService = ReportService;

    createReport = async (req: Request, res: Response) => {
        const userId = req.user.sub as string;
        const { targetId, targetType, reason } = req.body;

        try {
            const report = await this.reportService.createReport(
                userId,
                targetId,
                targetType,
                reason,
            );
            res.status(201).json({
                message: 'Report created successfully',
                report,
            });
        } catch (error: any) {
            console.error('Error creating report:', error);

            if (error.message === 'INVALID_TARGET_TYPE') {
                return res.status(400).json({
                    message: 'Invalid target type',
                });
            }

            if (error.message === 'NOT_FOUND') {
                return res.status(400).json({
                    message: 'The item you are trying to report does not exist',
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    return res.status(400).json({
                        message: 'You have already reported this item',
                    });
                }
            }

            res.status(500).json({
                message: 'An error occurred while creating the report',
            });
        }
    };
}

export default new ReportController();
