export type CreateReplyNotificationParams =
    | {
          recipientId: string;
          actorId: string;

          type: 'ANSWER_REPLY';

          questionId: string;
          answerId: string;
          replyId: string;
      }
    | {
          recipientId: string;
          actorId: string;

          type: 'COMMENT_REPLY';

          postId: string;
          commentId: string;
          replyId: string;
      }
    | {
          recipientId: string;
          actorId: string;

          type: 'COMMENT_REPLY_REPLY';

          postId: string;
          parentReplyId: string;
          replyId: string;
      }
    | {
          recipientId: string;
          actorId: string;

          type: 'ANSWER_REPLY_REPLY';

          questionId: string;
          parentReplyId: string;
          replyId: string;
      };

export type CreateCommentNotificationParams =
    | {
          recipientId: string;
          actorId: string;

          type: 'COMMENT';

          postId: string;
          commentId: string;
      }
    | {
          recipientId: string;
          actorId: string;

          type: 'ANSWER';

          questionId: string;
          answerId: string;
      };

export type CreatePostOrQuestionLikeNotificationParams =
    | {
          recipientId: string;
          actorId: string;

          type: 'POST_LIKE';

          postId: string;
      }
    | {
          recipientId: string;
          actorId: string;

          type: 'QUESTION_LIKE';

          questionId: string;
      };

export type CreatePostOrQuestionApprovalNotificationParams =
    | {
          recipientId: string;
          actorId: string;
          type: 'POST_APPROVAL';
          postId: string;
      }
    | {
          recipientId: string;
          actorId: string;
          type: 'QUESTION_APPROVAL';
          questionId: string;
      };

export type CreatePostOrQuestionRejectionNotificationParams = {
    recipientId: string;
    actorId: string;
    type: 'POST_REJECTION' | 'QUESTION_REJECTION';
    title: string;
    reason: string;
};
