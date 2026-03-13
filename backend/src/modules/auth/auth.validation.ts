import { query, ValidationChain } from 'express-validator';

const authValidation: {
    validateHandleCallback: ValidationChain[];
} = {
    validateHandleCallback: [
        query('code')
            .notEmpty()
            .withMessage('Authorization code is required')
            .isString()
            .withMessage('Authorization code must be a string'),

        query('state')
            .notEmpty()
            .withMessage('State parameter is required')
            .isString()
            .withMessage('State parameter must be a string'),
    ],
};

export default authValidation;
