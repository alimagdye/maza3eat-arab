import { prisma } from '../../../lib/client.js';
import { ReportTargetType } from '../../../types/report.js';
// when resolved it will be deleted, when rejected it will be deleted
class ReportService {
    private author = {
        select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            tier: {
                select: {
                    id: true,
                    name: true,
                    badgeColor: true,
                },
            },
        },
    };
    async getReports(cursor: string | null = null) {
        const take = 10;

        const reports = await prisma.report.findMany({
            take,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            select: {
                id: true,
                createdAt: true,
                targetType: true,
                reason: true,
                reporter: this.author,
            },
        });

        const hasMore = reports.length === take;

        const nextCursor = hasMore ? reports[reports.length - 1].id : null;

        return { reports, nextCursor, hasMore };
    }

    async getReportById(id: string) {
        const report = await prisma.report.findUniqueOrThrow({
            where: { id },
        });

        const data: any = {};

        switch (report.targetType) {
            case 'COMMENT':
                data.targetType = 'COMMENT';
                const comment = await prisma.comment.findUniqueOrThrow({
                    where: { id: report.commentId as string },
                    select: {
                        postId: true,
                        id: true,
                        content: true,
                        likesCount: true,
                        createdAt: true,
                        repliesCount: true,
                        author: this.author,
                    },
                });

                data.postId = comment.postId;
                data.comment = comment;

                break;
            case 'ANSWER':
                data.targetType = 'ANSWER';
                const answer = await prisma.answer.findUniqueOrThrow({
                    where: { id: report.answerId as string },
                    select: {
                        questionId: true,
                        id: true,
                        content: true,
                        totalVoteValue: true,
                        createdAt: true,
                        repliesCount: true,
                        author: this.author,
                    },
                });

                data.questionId = answer.questionId;
                data.answer = answer;

                break;
            case 'COMMENT_REPLY':
                data.targetType = 'COMMENT_REPLY';
                data.replyId = report.replyId;
                const reply = await prisma.reply.findUniqueOrThrow({
                    where: { id: data.replyId },
                    select: {
                        id: true,
                        createdAt: true,
                        content: true,
                        likesCount: true,
                        depth: true,
                        path: true,
                        replies: {
                            take: 1,
                            select: {
                                id: true,
                            },
                        },
                        comment: {
                            select: {
                                id: true,
                                postId: true,
                                content: true,
                                likesCount: true,
                                createdAt: true,
                                repliesCount: true,
                                author: this.author,
                            },
                        },
                        author: this.author,
                    },
                });

                data.reply = {
                    id: reply.id,
                    content: reply.content,
                    likesCount: reply.likesCount,
                    depth: reply.depth,
                    path: reply.path,
                    createdAt: reply.createdAt,
                    author: reply.author,
                    hasReplies: reply.replies.length > 0,
                };
                data.comment = reply.comment;
                data.postId = reply.comment.postId;

                break;
            case 'ANSWER_REPLY':
                data.targetType = 'ANSWER_REPLY';
                data.answerReplyId = report.answerReplyId;
                const answerReply = await prisma.answerReply.findUniqueOrThrow({
                    where: { id: data.answerReplyId },
                    select: {
                        id: true,
                        createdAt: true,
                        content: true,
                        likesCount: true,
                        depth: true,
                        path: true,
                        answerReplies: {
                            take: 1,
                            select: {
                                id: true,
                            },
                        },
                        answer: {
                            select: {
                                id: true,
                                questionId: true,
                                content: true,
                                totalVoteValue: true,
                                createdAt: true,
                                author: this.author,
                                repliesCount: true,
                            },
                        },
                        author: this.author,
                    },
                });

                data.reply = {
                    id: answerReply.id,
                    content: answerReply.content,
                    likesCount: answerReply.likesCount,
                    depth: answerReply.depth,
                    path: answerReply.path,
                    createdAt: answerReply.createdAt,
                    author: answerReply.author,
                    hasReplies: answerReply.answerReplies.length > 0,
                };
                data.answer = answerReply.answer;
                data.questionId = answerReply.answer.questionId;

                break;
            case 'ANSWER_REPLY_REPLY':
                data.targetType = 'ANSWER_REPLY_REPLY';
                data.answerReplyId = report.answerReplyId;
                const answerReplyReply =
                    await prisma.answerReply.findUniqueOrThrow({
                        where: { id: data.answerReplyId },
                        select: {
                            id: true,
                            createdAt: true,
                            content: true,
                            likesCount: true,
                            depth: true,
                            path: true,
                            author: this.author,
                            answerReplies: {
                                take: 1,
                                select: {
                                    id: true,
                                },
                            },
                            parentReply: {
                                select: {
                                    id: true,
                                    content: true,
                                    likesCount: true,
                                    createdAt: true,
                                    depth: true,
                                    path: true,
                                    author: this.author,
                                    answer: {
                                        select: {
                                            questionId: true,
                                        },
                                    },
                                },
                            },
                        },
                    });

                data.reply = {
                    id: answerReplyReply.id,
                    content: answerReplyReply.content,
                    likesCount: answerReplyReply.likesCount,
                    depth: answerReplyReply.depth,
                    path: answerReplyReply.path,
                    createdAt: answerReplyReply.createdAt,
                    author: answerReplyReply.author,
                    hasReplies: answerReplyReply.answerReplies.length > 0,
                };
                data.parentReply = {
                    id: answerReplyReply.parentReply?.id,
                    content: answerReplyReply.parentReply?.content,
                    likesCount: answerReplyReply.parentReply?.likesCount,
                    depth: answerReplyReply.parentReply?.depth,
                    path: answerReplyReply.parentReply?.path,
                    createdAt: answerReplyReply.parentReply?.createdAt,
                    author: answerReplyReply.parentReply?.author,
                    hasReplies: true,
                };
                data.questionId =
                    answerReplyReply.parentReply?.answer.questionId;

                break;
            case 'COMMENT_REPLY_REPLY':
                data.targetType = 'COMMENT_REPLY_REPLY';
                data.replyId = report.replyId;
                const commentReplyReply = await prisma.reply.findUniqueOrThrow({
                    where: { id: data.replyId },
                    select: {
                        id: true,
                        createdAt: true,
                        content: true,
                        likesCount: true,
                        depth: true,
                        path: true,
                        author: this.author,
                        replies: {
                            take: 1,
                            select: {
                                id: true,
                            },
                        },
                        parentReply: {
                            select: {
                                id: true,
                                content: true,
                                likesCount: true,
                                createdAt: true,
                                depth: true,
                                path: true,
                                author: this.author,

                                comment: {
                                    select: {
                                        postId: true,
                                    },
                                },
                            },
                        },
                    },
                });

                data.reply = {
                    id: commentReplyReply.id,
                    content: commentReplyReply.content,
                    likesCount: commentReplyReply.likesCount,
                    depth: commentReplyReply.depth,
                    path: commentReplyReply.path,
                    createdAt: commentReplyReply.createdAt,
                    author: commentReplyReply.author,
                    hasReplies: commentReplyReply.replies.length > 0,
                };
                data.parentReply = {
                    id: commentReplyReply.parentReply?.id,
                    content: commentReplyReply.parentReply?.content,
                    likesCount: commentReplyReply.parentReply?.likesCount,
                    depth: commentReplyReply.parentReply?.depth,
                    path: commentReplyReply.parentReply?.path,
                    createdAt: commentReplyReply.parentReply?.createdAt,
                    author: commentReplyReply.parentReply?.author,
                    hasReplies: true,
                };
                data.postId = commentReplyReply.parentReply?.comment.postId;

                break;
            case 'CONTACT_REQUEST':
                data.targetType = 'CONTACT_REQUEST';
                const contactRequest = await prisma.contactRequest.findFirst({
                    where: {
                        id: report.contactRequestId as string,
                    },
                    select: {
                        id: true,
                        requester: this.author,
                        receiverId: true,
                        reason: true,
                        status: true,
                        lastActivityAt: true,
                        requesterHasRead: true,
                        receiverHasRead: true,
                    },
                });
                data.contactRequest = contactRequest;

                break;
            default:
                throw new Error('Invalid target type');
        }

        return data;
    }

    async deleteReportById(id: string) {
        await prisma.report.delete({
            where: { id },
        });
    }
}

export default new ReportService();
