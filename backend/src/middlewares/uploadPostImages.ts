import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import busboy from 'busboy';

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
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
    // First, parse the multipart data to extract text fields
    const bb = busboy({ headers: req.headers });
    const fields: { [key: string]: string } = {};
    const files: Express.Multer.File[] = [];

    bb.on('field', (fieldname, val) => {
        fields[fieldname] = val;
    });

    bb.on('file', (fieldname, file, info) => {
        if (fieldname === 'images') {
            const chunks: Buffer[] = [];
            file.on('data', (chunk) => {
                chunks.push(chunk);
            });
            file.on('end', () => {
                files.push({
                    fieldname,
                    originalname: info.filename,
                    encoding: info.encoding,
                    mimetype: info.mimeType,
                    buffer: Buffer.concat(chunks),
                    size: Buffer.concat(chunks).length,
                } as Express.Multer.File);
            });
        } else {
            file.resume();
        }
    });

    bb.on('close', () => {
        // Initialize req.body if it doesn't exist
        if (!req.body) req.body = {};
        
        // Set parsed fields to req.body
        req.body.title = fields.title;
        req.body.content = fields.content;
        
        // Parse tags from JSON string
        try {
            req.body.tags = fields.tags ? JSON.parse(fields.tags) : [];
        } catch (e) {
            req.body.tags = [];
        }

        // Set files for multer-like behavior
        req.files = files as any;

        next();
    });

    bb.on('error', (error) => {
        return res.status(400).json({
            status: 'fail',
            message: 'Error parsing form data: ' + error.message,
        });
    });

    req.pipe(bb);
};
