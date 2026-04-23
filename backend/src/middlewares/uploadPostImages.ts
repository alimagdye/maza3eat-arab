import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files allowed'));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        files: 6,
        fileSize: 10 * 1024 * 1024,
    },
}).array('images', 6);

export const uploadPostImages = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    upload(req, res, function (error) {
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Image too large (max 10MB)',
                });
            }

            if (error.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Max 6 images allowed',
                });
            }

            if (error.message === 'Only image files allowed') {
                return res.status(400).json({
                    status: 'fail',
                    message: error.message,
                });
            }

            return res.status(400).json({
                status: 'fail',
                message: error.message,
            });
        }

        if (error) {
            return res.status(400).json({
                status: 'fail',
                message: error.message,
            });
        }

        next();
    });
};
