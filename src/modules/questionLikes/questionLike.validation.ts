import { body, param, ValidationChain } from 'express-validator';

const likeValidation: {
    validateLikeOrUnlikeQuestion: ValidationChain[];
    validateVoteOrUnVoteAnswer: ValidationChain[];
    validateLikeOrUnlikeReply: ValidationChain[];
} = {
    validateLikeOrUnlikeQuestion: [
        param('questionId').isUUID().withMessage('Invalid question ID format'),
    ],
    validateVoteOrUnVoteAnswer: [
        param('answerId').isUUID().withMessage('Invalid answer ID format'),
        body('value').isIn([1, -1]).withMessage('Value must be either upvote or downvote'),
    ],
    validateLikeOrUnlikeReply: [
        param('replyId').isUUID().withMessage('Invalid reply ID format'),
    ],
};

export default likeValidation;
