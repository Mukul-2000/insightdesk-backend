import { Request } from 'express';
import multer from 'multer';
import { AppError } from '../errorhandler/appError.js';

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
    // 🚨 UPDATED: Accept BOTH standard text files and formal PDF documents
    const allowedTypes = ['text/plain', 'application/pdf'];

    if (allowedTypes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(new AppError('Invalid file type. Only standard text (.txt) and PDF (.pdf) files are accepted.', 400));
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // Expanded slightly to 5MB since PDFs carry heavier structural metadata
    }
});