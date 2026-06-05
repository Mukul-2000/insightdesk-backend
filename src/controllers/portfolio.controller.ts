import express from 'express';
import { AppError } from '../errorhandler/appError.js';
import { GeminiService } from '../services/gemini.service.js';
import { DocumentDao } from '../dao/document.dao.js';
import { ai } from '../config/gemini.js';

export class PortfolioChatController {

    static async chatWithPortfolioKB(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            // 1. Read 'message' payload directly from your portfolio's frontend fetch signature
            const { question } = req.body;

            if (!question || typeof question !== 'string') {
                throw new AppError('A valid message string is required to consult the portfolio assistant.', 400);
            }

            // 2. Convert incoming message text into a vector coordinate map
            const queryVector = await GeminiService.generateEmbedding(question);

            // 3. Query global Atlas Vector Search database chunks (removed userId filter)
            const relevantMatches = await DocumentDao.portfolioVectorSearch(queryVector, 3);

            // 4. Safely extract matches or define fallback notice string
            const hasContext = relevantMatches && relevantMatches.length > 0;
            const contextText = hasContext
                ? relevantMatches.map((doc: any) => doc.textChunk).join('\n\n')
                : "No matching document context found.";

            const uniqueSources = hasContext
                ? Array.from(new Set(relevantMatches.map((doc: any) => doc.fileName)))
                : [];

            // 5. Construct a heavily constrained system prompt guarding target content bounds
            const structuredPrompt = `
You are an advanced, specialized AI Portfolio Assistant for Mukul Sindhu, a Senior Full Stack Developer.

[GROUNDED PORTFOLIO & TECH CONTEXT]
${contextText}

[CURRENT USER INQUIRY]
User: ${question}

CRITICAL OPERATIONAL BOUNDARIES:
- GREETINGS & GOODBYES: If the user says hello, hi, hey, goodbye, bye, or generic casual pleasantries, respond warmly, politely, and conversationally as Mukul's assistant.
- ON-TOPIC TOPICS: If the user is asking about Mukul Sindhu, his technical skills, core competencies, professional employment history, or project details found within the context data (like DocFlow, Smart Meeting Hub, Dhunguru, SynchFit, etc.), use the provided context to answer accurately, professionally, and clearly.
- OFF-TOPIC RULE: If the user asks about ANYTHING else completely unrelated to Mukul Sindhu, his tech stack, or his portfolio projects (e.g., general programming math questions, riddles, unrelated world news, cooking recipes, or random facts), you must respond with EXACTLY this phrase or a close variant of it: "I do not have information about this." Do not hallucinate or try to answer off-topic queries under any circumstances.
`;

            // 6. Execute model content synthesis targeting your flash runtime instance
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: structuredPrompt,
            });

            const finalReply = response.text || "I am unable to process an answer at this moment.";

            // 7. Return payload configured exactly to line 75 of your frontend appendMessage logic
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