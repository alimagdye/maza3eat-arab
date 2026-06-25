import { query, param, ValidationChain } from 'express-validator';

const reportValidation: {
    validateGetReports: ValidationChain[];
    validateGetReportById: ValidationChain[];
} = {
    validateGetReports: [
        query('cursor')
            .trim()
            .optional()
            .isString()
            .withMessage('Cursor must be a string'),
    ],
    validateGetReportById: [
        param('reportId').isUUID().withMessage('Invalid report ID'),
    ],
};

export default reportValidation;
