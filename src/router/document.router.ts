import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller.js';
import { upload } from '../middlewares/upload.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Inject Multer as middleware. 'file' is the exact key name we will check for in the request
router.post('/ingest', requireAuth, upload.single('file'), DocumentController.ingestText);

export default router;