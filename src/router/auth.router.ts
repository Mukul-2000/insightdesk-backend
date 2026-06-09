import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/google', AuthController.googleLogin);
router.post('/update-password', requireAuth, AuthController.updatePassword);

export default router;