import { Request, Response } from 'express';
import { ChatDao } from '../dao/chat.dao.js';

export class ChatController {

    static async getHistory(req: Request, res: Response): Promise<void> {
        try {
            // 🔑 Securely pull the ID from the token envelope, NOT the URL
            const userId = (req as any).user?.userId;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized. User information missing from token.' });
                return;
            }

            // Call your DAO layer method using the authenticated user ID
            const history = await ChatDao.getRecentHistory(userId, 20); 

            res.status(200).json(history);
        } catch (error: any) {
            console.error('Error fetching chat history:', error);
            res.status(500).json({
                message: 'Failed to retrieve chat history from server',
                error: error.message
            });
        }
    }
}