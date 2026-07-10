import { body, query, ValidationChain } from 'express-validator';

const announcementValidation: {
    validateCreateAnnouncement: ValidationChain[];
    validateGetAnnouncements: ValidationChain[];
} = {
    validateCreateAnnouncement: [
        body('message')
            .isString()
            .trim()
            .isLength({ min: 3, max: 300 })
            .withMessage('Incorrect message length'),
    ],

    validateGetAnnouncements: [
        query('cursor').optional().isUUID().withMessage('Invalid cursor'),
    ],
};

export default announcementValidation;
