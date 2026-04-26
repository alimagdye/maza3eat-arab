import crypto from 'crypto';
import { ContactMethod } from '../../types/contact.js';

// must be 32 bytes (base64 or hex decoded)
class ContactUtils {
    private readonly ALGO: crypto.CipherGCMTypes = 'aes-256-gcm';
    private readonly IV_LENGTH = 12;
    private readonly KEY: Buffer;

    constructor() {
        const keyBase64 = process.env.CONTACT_ENCRYPTION_KEY;
        if (!keyBase64) {
            // FATAL: CONTACT_ENCRYPTION_KEY environment variable is missing.
            throw new Error('MISSING_CONTACT_ENCRYPTION_KEY');
        }

        this.KEY = Buffer.from(keyBase64, 'base64');

        // AES-256 requires a 32-byte key. Fail fast if it's wrong.
        if (this.KEY.length !== 32) {
            // FATAL: CONTACT_ENCRYPTION_KEY must be exactly 32 bytes when base64 decoded.
            throw new Error('INVALID_CONTACT_ENCRYPTION_KEY_LENGTH');
        }
    }

    encrypt(text: string) {
        const iv = crypto.randomBytes(this.IV_LENGTH);
        const cipher = crypto.createCipheriv(this.ALGO, this.KEY, iv);

        try {
            const encrypted = Buffer.concat([
                cipher.update(text, 'utf8'),
                cipher.final(),
            ]);

            const tag = cipher.getAuthTag();

            // store iv + tag + ciphertext (base64)
            return Buffer.concat([iv, tag, encrypted]).toString('base64');
        } catch (error) {
            throw new Error('ENCRYPTION_FAILED');
        }
    }

    decrypt(payload: string) {
        const data = Buffer.from(payload, 'base64');

        if (data.length < this.IV_LENGTH + 16) {
            // Invalid payload: must be at least long enough to contain IV and tag
            throw new Error('INVALID_ENCRYPTED_PAYLOAD');
        }

        const iv = data.subarray(0, this.IV_LENGTH);
        const tag = data.subarray(this.IV_LENGTH, this.IV_LENGTH + 16);
        const encrypted = data.subarray(this.IV_LENGTH + 16);

        const decipher = crypto.createDecipheriv(this.ALGO, this.KEY, iv);
        decipher.setAuthTag(tag);

        try {
            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final(),
            ]);
            return decrypted.toString('utf8');
        } catch {
            // Decryption failed (e.g., due to tampering or wrong key)
            throw new Error('FAILED_TO_DECRYPT_CONTACT_DATA');
        }
    }

    normalizeContact(type: ContactMethod, value: string): string {
        const trimmed = value.trim();

        if (type === 'WHATSAPP') {
            const hasPlus = trimmed.startsWith('+');
            const digits = trimmed.replace(/\D/g, '');

            return hasPlus ? `+${digits}` : digits;
        }

        return trimmed;
    }

    validateContact(type: ContactMethod, value: string) {
        switch (type) {
            case 'EMAIL':
                return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(
                    value,
                );

            case 'WHATSAPP':
                return /^\+\d{10,15}$/.test(value);

            case 'FACEBOOK':
                return /^(https?:\/\/)?(www\.)?facebook\.com\/[A-Za-z0-9.]+\/?$/.test(
                    value,
                );

            case 'INSTAGRAM':
                return /^[a-z0-9](?!.*\.\.)(?!.*__)[a-z0-9._]{1,29}$/.test(
                    value,
                );

            default:
                return false;
        }
    }
}

export default new ContactUtils();
