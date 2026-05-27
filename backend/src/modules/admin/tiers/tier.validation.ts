import { body, param, ValidationChain } from 'express-validator';

const tierValidation: {
    allowFields: string[];
    validateUpdateTier: ValidationChain[];
} = {
    allowFields: ['name', 'description', 'badgeColor'],
    validateUpdateTier: [
        param('tierId')
            .isInt({ gt: 0 })
            .withMessage('Tier ID must be a positive integer'),

        body()
            .custom((value) => {
                const keys = Object.keys(value);

                return (
                    keys.length > 0 &&
                    keys.every((key) =>
                        tierValidation.allowFields.includes(key),
                    )
                );
            })
            .withMessage(
                'At least one valid field must be provided: name, description, badgeColor',
            ),

        body('name')
            .optional()
            .trim()
            .isString()
            .isLength({ min: 1, max: 50 })
            .withMessage('Name must be between 1 and 50 characters'),

        body('description')
            .optional()
            .trim()
            .isString()
            .isLength({ min: 1, max: 500 })
            .withMessage('Description must be between 1 and 500 characters'),

        body('badgeColor')
            .optional()
            .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
            .withMessage('Badge color must be a valid hex color'),
    ],
};

export default tierValidation;
