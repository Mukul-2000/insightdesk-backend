import express from 'express';
import { DocumentDao } from '../dao/document.dao.js';
import { ChatDao } from '../dao/chat.dao.js';
import { GeminiService } from '../services/gemini.service.js';
import { AppError } from '../errorhandler/appError.js';
import { ai } from '../config/gemini.js';

export class AiController {
    static async getResponse(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { prompt } = req.body;
            const result = await GeminiService.generateText(prompt);
            res.send({ success: true, reply: result });
        } catch (error) {
            next(error);
        }
    }


    static async chatWithKnowledgeBase(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { question } = req.body;
            const userId = (req as any).user.userId; // Extracted safely from requireAuth token guard

            if (!question) {
                throw new AppError('A clear question string is required to consult the knowledge context base.', 400);
            }

            // 1. Fetch recent chat history from MongoDB to keep the conversation conversational
            const recentHistory = await ChatDao.getRecentHistory(userId, 6);

            // 2. Transpile the incoming question to a vector array coordinate
            const queryVector = await GeminiService.generateEmbedding(question);

            // 3. Query Atlas Vector Search
            const relevantMatches = await DocumentDao.vectorSearch(queryVector, userId, 3);

            // Save user question to database immediately
            await ChatDao.saveMessage(userId, 'user', question);

            // REMOVED THE HARD BACKEND FALLBACK BLOCK HERE ❌
            // Instead, safely parse whatever matches came back, or default to an empty notice string:
            const hasContext = relevantMatches && relevantMatches.length > 0;
            const contextText = hasContext
                ? relevantMatches.map((doc: any) => doc.textChunk).join('\n\n')
                : "No matching document context found in the database for this specific query.";

            const uniqueSources = hasContext
                ? Array.from(new Set(relevantMatches.map((doc: any) => doc.fileName)))
                : [];

            // 5. Format Chat History
            const historyTranscript = recentHistory
                .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
                .join('\n');

            // 6. Build a smarter conversational RAG prompt
            const structuredPrompt = `
You are an intelligent, contextual SaaS support assistant. 

[CONVERSATION HISTORY TRANSCRIPT]
${historyTranscript || 'No prior messages in this conversation session.'}

[GROUNDED DOCUMENT CONTEXT]
${contextText}

[CURRENT USER QUESTION]
User: ${question}

Instructions:
- If the user is just greeting you (e.g., "hello", "hi", "hey", "good morning"), respond warmly and conversationally without complaining about missing documents.
- If the user is asking a specific factual question and the context says "No matching document context found", politely inform them that you don't have access to that information yet because they haven't uploaded the relevant CV or document. Do not hallucinate data.
- If matching context IS provided, answer the question accurately using only that data.
`;

            // 7. Fire the content generator call via the modern SDK layout
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash', // or your target text model identifier
                contents: structuredPrompt,
            });

            const finalReply = response.text || "I was unable to process an answer at this time.";

            // 8. Save the AI's generated response to the chat log database
            await ChatDao.saveMessage(userId, 'model', finalReply);

            // 9. Return the full response package back to the user client
            res.status(200).json({
                success: true,
                reply: finalReply,
                sources: uniqueSources
            });

        } catch (error) {
            next(error);
        }
    }
}