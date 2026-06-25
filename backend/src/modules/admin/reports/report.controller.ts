import { Request, Response } from 'express';
import ReportService from './report.service.js';
import { Prisma } from '@prisma/client';

class ReportController {
    private reportService = ReportService;

    getReport = async (req: Request, res: Response) => {
        const cursor: string | null = req.query.cursor as string | null;

        try {
            const reports = await this.reportService.getReports(cursor);
            res.status(201).json({
                status: 'success',
                data: reports,
            });
        } catch (error: any) {
            console.error('Error retrieving reports:', error);

            res.status(500).json({
                status: 'error',
                message: 'An error occurred while retrieving the reports',
            });
        }
    };

    getReportById = async (req: Request, res: Response) => {
        const reportId: string = req.params.reportId as string;

        try {
            const report = await this.reportService.getReportById(reportId);

            if (!report) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Report not found',
                });
            }

            res.status(200).json({
                status: 'success',
                data: report,
            });
        } catch (error: any) {
            console.error('Error retrieving report:', error);

            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Report not found',
                });
            }

            res.status(500).json({
                status: 'error',
                message: 'An error occurred while retrieving the report',
            });
        }
    };

    deleteReportById = async (req: Request, res: Response) => {
        const reportId: string = req.params.reportId as string;

        try {
            await this.reportService.deleteReportById(reportId);

            res.status(204).send();
        } catch (error: any) {
            console.error('Error deleting report:', error);

            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Report not found',
                });
            }

            res.status(500).json({
                status: 'error',
                message: 'An error occurred while deleting the report',
            });
        }
    };
}

export default new ReportController();
