import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';

const storage = multer.memoryStorage();
const ALLOWED_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
]);

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
        fileSize: 5 * 1024 * 1024,
    },
}).array('images', 6);

export const uploadPostImages = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    upload(req, res, async function (error) {
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Image too large (max 5MB)',
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
        try {
            const files = (req.files as Express.Multer.File[]) || [];
            if (files.length === 0) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Please upload at least one image',
                });
            }

            await Promise.all(
                files.map(async (file) => {
                    const type = await fileTypeFromBuffer(file.buffer);

                    if (!type || !ALLOWED_TYPES.has(type.mime)) {
                        throw new Error('Invalid image file');
                    }

                    const metadata = await sharp(file.buffer, {
                        limitInputPixels: 30_000_000,
                    }).metadata();

                    if (!metadata.width || !metadata.height) {
                        throw new Error('Invalid image');
                    }

                    if (metadata.width > 8000 || metadata.height > 8000) {
                        throw new Error('Image dimensions too large');
                    }
                }),
            );

            next();
        } catch (error: any) {
            return res.status(400).json({
                status: 'fail',
                message: error.message || 'Invalid image file',
            });
        }
    });
};
