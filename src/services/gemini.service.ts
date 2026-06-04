import { ai, GEMINI_MODEL } from '../config/gemini.js';
import { AppError } from '../errorhandler/appError.js';

export class GeminiService {
  public static async generateText(prompt: string): Promise<string> {
    if (!prompt) {
      throw new AppError('Prompt text is empty or missing', 400);
    }
    
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    if (!response.text) {
      throw new AppError('Failed to fetch a response from Gemini AI', 502);
    }

    return response.text;
  }

  /**
   * Converts text chunks into a 768-dimensional math vector
   */
  public static async generateEmbedding(text: string): Promise<number[]> {
    if (!text) {
      throw new AppError('Text content is required to generate embeddings', 400);
    }

    // Call the unified embedContent API
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2', // 🚨 FIXED: Updated from 'text-embedding-004'
      contents: text,
    });

    if (!response.embeddings || response.embeddings.length === 0 || !response.embeddings[0].values) {
      throw new AppError('Failed to generate semantic vector embedding from Google AI Studio', 502);
    }

    return response.embeddings[0].values;
  }
}