import { Router } from 'express';
import multer from 'multer';
import { StudioController } from '../controllers/studio.controller.js';
import { upload } from '../middlewares/upload.middleware.js';
import { studioRateLimiter } from '../middlewares/rateLimiter.middleware.js';
// import { requireAuth } from '../middleware/auth'; // Use your existing auth middleware

const router = Router();

// Route: POST /api/studio/repurpose
router.post('/repurpose', studioRateLimiter, upload.single('media'), StudioController.generateCampaign);

export default router;