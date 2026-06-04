import { Router } from 'express';
import { AiController } from '../controllers/ai.controller.js';
import { ValidationMiddleware } from '../middlewares/validation.middleware.js';
import { aiChatSchema, aiPromptSchema } from '../validate/validationSchema.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/test-ai', ValidationMiddleware.validate(aiPromptSchema), AiController.getResponse);
router.post('/chat', requireAuth, ValidationMiddleware.validate(aiChatSchema), AiController.chatWithKnowledgeBase);

export default router;