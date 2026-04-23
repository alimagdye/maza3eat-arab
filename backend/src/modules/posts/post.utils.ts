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

    // Inside your postUtils class...
    async uploadBuffer(buffer: Buffer, filename: string) {
        // 1. FAST PRE-PROCESSING: Shrink the physical dimensions and convert to WebP
        // A 4K image might drop from 6MB to 400KB here, taking milliseconds.
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
                    // 2. CLOUDINARY FINAL POLISH
                    transformation: [
                        {
                            // Let Cloudinary serve the best format for the user's browser
                            quality: 'auto:best',
                            fetch_format: 'auto',
                            // You no longer need to crop/resize here because sharp already did it!
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

            // 3. Upload the tiny, optimized buffer instead of the massive original one
            stream.end(optimizedBuffer);
        });
    }

    async deleteImages(publicIds: string[]) {
        await cloudinary.api.delete_resources(publicIds);
    }
}

export default new PostUtils();
