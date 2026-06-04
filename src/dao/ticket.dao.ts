import { Ticket, ITicket } from '../models/ticket.model.js';

export class TicketDao {
    /**
     * Persists a new support ticket to the database
     */
    static async createTicket(ticketData: Partial<ITicket>): Promise<ITicket> {
        // All direct database modification lives strictly here
        return await Ticket.create(ticketData);
    }

    /**
     * Finds a ticket by its MongoDB ObjectID
     */
    static async getTicketById(id: string): Promise<ITicket | null> {
        return await Ticket.findById(id);
    }
}