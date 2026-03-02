import { RequestHandler } from 'express';
import { validationResult } from 'express-validator';

const validate: RequestHandler = (req, res, next) => {
    const result = validationResult(req);

    if (result.isEmpty()) {
        return next();
    }

    const formattedErrors: Record<string, string> = {};

    for (const error of result.array({ onlyFirstError: true })) {
        if ('path' in error) {
            formattedErrors[error.path] = error.msg;
        } else {
            formattedErrors['general'] = error.msg;
        }
    }

    return res.status(422).json({
        status: 'fail',
        message: 'Validation failed',
        errors: formattedErrors,
    });
};

export default validate;
