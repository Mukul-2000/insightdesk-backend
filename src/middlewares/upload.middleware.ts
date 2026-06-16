import multer from 'multer';
import path from 'path';
import { AppError } from '../errorhandler/appError.js';

// ⚡ 1. Expanded whitelist to support media parsing formats
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.docx', '.csv', '.md', '.png', '.jpg', '.jpeg', '.mp3', '.mp4', '.m4a', '.wav'];

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'application/vnd.ms-excel',
    'image/png',
    'image/jpeg',
    'image/jpg',
    // ✨ New Media Stream Content Whitelists
    'audio/mpeg',       // .mp3
    'video/mp4',        // .mp4
    'audio/mp4',        // .m4a variant
    'audio/x-m4a',      // alternative .m4a tracking
    'audio/wav',        // .wav
    'audio/x-wav'       // alternative .wav tracking
];

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    const isExtensionAllowed = ALLOWED_EXTENSIONS.includes(fileExtension);
    const isMimeTypeAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype);

    if (isExtensionAllowed || isMimeTypeAllowed) {
        cb(null, true);
    } else {
        cb(
            new AppError(
                `Invalid file format: "${fileExtension}". System accepts PDF, DOCX, CSV, MD, TXT, PNG, JPG, MP3, MP4, M4A, and WAV elements.`, 
                400
            )
        );
    }
};

export const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: fileFilter,
    limits: {
        fileSize: 25 * 1024 * 1024 // ⚡ Bumped to 25MB to accommodate larger audio/video files
    }
});