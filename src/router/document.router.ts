import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller.js';
import { upload } from '../middlewares/upload.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Inject Multer as middleware. 'file' is the exact key name we will check for in the request
router.post('/ingest', requireAuth, upload.single('file'), DocumentController.ingestText);

// 2. GET /api/v1/documents/files -> Fetch unique files overview map list for a user account
router.get('/files', requireAuth, DocumentController.getUploadedFiles);

// 3. DELETE /api/v1/documents/files -> Execute a cascading delete on S3 objects and Atlas chunks
router.delete('/files', requireAuth, DocumentController.deleteFile);

export default router;