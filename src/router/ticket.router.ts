import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller.js'; // Note matching extension resolution
import { createTicketSchema } from '../validate/validationSchema.js';
import { ValidationMiddleware } from '../middlewares/validation.middleware.js';

const router = Router();

router.post('/create', ValidationMiddleware.validate(createTicketSchema), TicketController.createTicket);

export default router;