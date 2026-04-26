import { stat } from 'fs';
import { prisma } from '../../lib/client.js';
import { ReportTargetType } from '../../types/report.js';

class ReportService {
    async createReport(
        reporterId: string,
        targetId: string,
        targetType: ReportTargetType,
        reason: string,
    ) {
        const data: Record<string, string> & {
            reporterId: string;
            targetType: ReportTargetType;
            reason: string;
        } = {
            reporterId,
            targetType,
            reason,
        };

        // if used again move it to a separate function
        switch (targetType) {
            case 'COMMENT': {
                const exists = await prisma.comment.findUnique({
                    where: { id: targetId },
                    select: { id: true },
                });

                if (!exists) {
                    throw new Error('NOT_FOUND');
                }

                data.commentId = targetId;
                break;
            }

            case 'ANSWER': {
                const exists = await prisma.answer.findUnique({
                    where: { id: targetId },
                    select: { id: true },
                });

                if (!exists) {
                    throw new Error('NOT_FOUND');
                }

                data.answerId = targetId;
                break;
            }

            case 'REPLY': {
                const exists = await prisma.reply.findUnique({
                    where: { id: targetId },
                    select: { id: true },
                });

                if (!exists) {
                    throw new Error('NOT_FOUND');
                }

                data.replyId = targetId;
                break;
            }

            case 'ANSWER_REPLY': {
                const exists = await prisma.answerReply.findUnique({
                    where: { id: targetId },
                    select: { id: true },
                });

                if (!exists) {
                    throw new Error('NOT_FOUND');
                }

                data.answerReplyId = targetId;
                break;
            }

            case 'CONTACT_REQUEST': {
                const exists = await prisma.contactRequest.findUnique({
                    where: { id: targetId },
                    select: { id: true },
                });

                if (!exists) {
                    throw new Error('NOT_FOUND');
                }

                data.contactRequestId = targetId;
                break;
            }

            default:
                throw new Error('INVALID_TARGET_TYPE');
        }

        const report = await prisma.report.create({
            data,
        });

        return {
            id: report.id,
            reporterId: report.reporterId,
            targetType: report.targetType,
            targetId: (report.commentId ||
                report.answerId ||
                report.replyId ||
                report.answerReplyId ||
                report.contactRequestId) as string,
            reason: report.reason,
            status: report.status,
            createdAt: report.createdAt,
        };
    }
}

export default new ReportService();
