import { Request, Response } from 'express';
import { ChatDao } from '../dao/chat.dao.js';
import { redisClient } from '../config/redis.js';

export class ChatController {

    static async getHistory(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized. User information missing from token.' });
                return;
            }

            // ⚡ REDIS TRACK: Create a dynamic key factoring in the 20-message layout window
            const cacheKey = `user:chat:history:${userId}:20`;
            
            const cachedHistory = await redisClient.get(cacheKey);
            if (cachedHistory) {
                res.status(200).json(JSON.parse(cachedHistory));
                return;
            }

            // Call your DAO layer method if cache misses
            const history = await ChatDao.getRecentHistory(userId, 20); 

            // 💾 WRITE-BACK: Cache results in Redis for 15 minutes (900 seconds)
            await redisClient.setEx(cacheKey, 900, JSON.stringify(history));

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