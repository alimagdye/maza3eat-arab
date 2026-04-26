import sharp from 'sharp';
import cloudinary from '../../config/cloudinary.js';
import crypto from 'crypto';
class PostUtils {
    safeName(name: string) {
        return name
            .toLowerCase()
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 30);
    }

    generateId(filename: string) {
        const random = crypto.randomBytes(6).toString('hex');

        return `${Date.now()}-${random}-${this.safeName(filename)}`;
    }

    async uploadBuffer(buffer: Buffer, filename: string) {
        const optimizedBuffer = await sharp(buffer)
            .resize({
                width: 2048,
                height: 2048,
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: 85 }) // 85 is the sweet spot: visually lossless but tiny file size
            .toBuffer();

        return new Promise<{
            url: string;
            publicId: string;
            width: number;
            height: number;
            originalName: string;
        }>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'posts',
                    public_id: this.generateId(filename),
                    transformation: [
                        {
                            quality: 'auto:best',
                            fetch_format: 'auto',
                        },
                    ],
                },
                (error, result) => {
                    if (error) return reject(error);

                    resolve({
                        url: result!.secure_url,
                        publicId: result!.public_id,
                        width: result!.width,
                        height: result!.height,
                        originalName: filename,
                    });
                },
            );

            stream.end(optimizedBuffer);
        });
    }

    async deleteImages(publicIds: string[]) {
        await cloudinary.api.delete_resources(publicIds);
    }
}

export default new PostUtils();
