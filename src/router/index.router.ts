import { Router } from 'express';
import aiRouter from './ai.router.js';
import ticketRouter from './ticket.router.js';
import documentRouter from './document.router.js';
import authRouter from './auth.router.js';
import chatRouter from './chat.router.js';

const appRouter = Router();

// Hook up all your sub-routers here as the app grows (e.g., ticketRouter, authRouter)
appRouter.use('/ai', aiRouter);
appRouter.use('/tickets', ticketRouter);
appRouter.use('/documents', documentRouter);
appRouter.use('/auth', authRouter);
appRouter.use('/chat', chatRouter);

export default appRouter;