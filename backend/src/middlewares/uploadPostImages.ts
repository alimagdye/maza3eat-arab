import multer from "multer";

const storage = multer.memoryStorage();

export const uploadPostImages = multer({
    storage,
    limits: {
        files: 6,
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});