import multer from 'multer';
import path from 'path';
import { AppError } from '../errorhandler/appError.js';

// ⚡ 1. Expand the whitelist of allowed extensions and MIME types
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.docx', '.csv', '.md', '.png', '.jpg', '.jpeg'];

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'text/csv',
    'application/vnd.ms-excel', // variant .csv format tracking
    'image/png',
    'image/jpeg',
    'image/jpg'
];

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    // ⚡ 2. Validate against both extension parsing and strict MIME-type streams
    const isExtensionAllowed = ALLOWED_EXTENSIONS.includes(fileExtension);
    const isMimeTypeAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype);

    if (isExtensionAllowed || isMimeTypeAllowed) {
        cb(null, true); // Pass validation check cleanly
    } else {
        cb(
            new AppError(
                `Invalid file format: "${fileExtension}". System accepts PDF, DOCX, CSV, MD, TXT, PNG, and JPG elements.`, 
                400
            )
        );
    }
};

// ⚡ 3. Configure storage and boundaries (using memoryStorage for S3 streaming)
export const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024 // Optional: Cap single files to 15MB 
    }
});