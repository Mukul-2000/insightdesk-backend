import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { PortfolioChatController } from '../controllers/portfolio.controller.js';
// import { protect } from '../middleware/auth.middleware.js'; // Add if you have auth middleware ready

const router = Router();

// This matches: GET /api/chat/history/:userId
router.get('/chat', PortfolioChatController.chatWithPortfolioKB); 

export default router;