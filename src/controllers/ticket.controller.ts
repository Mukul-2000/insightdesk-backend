import express from 'express';
import { TicketDao } from '../dao/ticket.dao.js';

export class TicketController {
    static async createTicket(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            // Data is guaranteed valid because of Joi middleware execution
            const newTicket = await TicketDao.createTicket(req.body);

            res.status(201).json({
                success: true,
                message: 'Support ticket logged successfully via DAO',
                data: newTicket
            });

        } catch (error) {
            next(error);
        }
    }
}