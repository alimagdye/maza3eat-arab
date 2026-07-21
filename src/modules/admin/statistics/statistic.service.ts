import { ContentStatus, ReportStatus } from '@prisma/client';
import { prisma } from '../../../lib/client.js';

const MAX_DISPLAY_COUNT = 99;
const FETCH_LIMIT = MAX_DISPLAY_COUNT + 1;

class StatisticService {
    private getBadgeData(length: number) {
        return {
            count: Math.min(length, MAX_DISPLAY_COUNT),
            isCapped: length > MAX_DISPLAY_COUNT,
        };
    }

    async getStatistics() {
        const [posts, questions, reports] = await Promise.all([
            prisma.post.findMany({
                where: {
                    status: ContentStatus.PENDING,
                },
                select: {
                    id: true,
                },
                take: FETCH_LIMIT,
            }),

            prisma.question.findMany({
                where: {
                    status: ContentStatus.PENDING,
                },
                select: {
                    id: true,
                },
                take: FETCH_LIMIT,
            }),

            prisma.report.findMany({
                where: {
                    status: ReportStatus.PENDING,
                },
                select: {
                    id: true,
                },
                take: FETCH_LIMIT,
            }),
        ]);

        return {
            pendingPosts: this.getBadgeData(posts.length),
            pendingQuestions: this.getBadgeData(questions.length),
            pendingReports: this.getBadgeData(reports.length),
        };
    }
}

export default new StatisticService();
