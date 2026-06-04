import { ChatMessage, IChatMessage } from '../models/chat.model.js';

export class ChatDao {
  /**
   * Save a single chat message turn (either user question or model reply)
   */
  static async saveMessage(userId: string, role: 'user' | 'model', content: string): Promise<IChatMessage> {
    return await ChatMessage.create({
      userId,
      role,
      content
    });
  }

  /**
   * Fetch the most recent chat turns for a user, sorted oldest-to-newest for prompt context
   */
  static async getRecentHistory(userId: string, limit: number = 6): Promise<IChatMessage[]> {
    const history = await ChatMessage.find({ userId })
      .sort({ createdAt: -1 }) // Get newest first
      .limit(limit);
    
    return history.reverse(); // Reverse so it reads chronologically (oldest to newest)
  }
}