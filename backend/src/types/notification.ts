import { Prisma } from '@prisma/client';

export type CreateReplyNotificationParams =
    | {
          tx: Prisma.TransactionClient;
          recipientId: string;
          actorId: string;

          type: 'ANSWER_REPLY';

          questionId: string;
          answerId: string;
          replyId: string;
      }
    | {
          tx: Prisma.TransactionClient;
          recipientId: string;
          actorId: string;

          type: 'COMMENT_REPLY';

          postId: string;
          commentId: string;
          replyId: string;
      }
    | {
          tx: Prisma.TransactionClient;
          recipientId: string;
          actorId: string;

          type: 'COMMENT_REPLY_REPLY';

          postId: string;
          parentReplyId: string;
          replyId: string;
      }
    | {
          tx: Prisma.TransactionClient;
          recipientId: string;
          actorId: string;

          type: 'ANSWER_REPLY_REPLY';

          questionId: string;
          parentReplyId: string;
          replyId: string;
      };
