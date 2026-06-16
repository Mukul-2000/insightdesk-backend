import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai'; // Reuse the OpenAI library wrapper for Groq text tasks
import { AGENT_PROMPTS } from '../config/aiConstants.js';

// Instantiate the cross-vendor free cloud instances
const geminiAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const groqText = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1'
});

interface RepurposeResult {
    twitterThread: string;
    linkedInPost: string;
    newsletter: string;
}

export class AgentOrchestrator {
    static async runPipeline(transcript: string, io: any, socketId: string): Promise<RepurposeResult> {
        
        // ⚡ ENGINE 1 (Google Gemini): Flash Hook Analysis
        this.emitStatus(io, socketId, 'Analyst', 'Gemini is isolating core video insights...');
        const hooks = await this.runHookAnalyst(transcript);

        // ⚡ ENGINE 2 (Groq / Llama 3.3): High-Fidelity Copywriting
        this.emitStatus(io, socketId, 'Ghostwriter', 'Groq Llama is generating stylistic social copy drafts...');
        const rawSocialContent = await this.runGroqGhostwriter(hooks);
        const socialDrafts = this.splitSocialContent(rawSocialContent);

        // ⚡ ENGINE 2 (Groq / Llama 3.3): High-Fidelity Newsletter Layout
        this.emitStatus(io, socketId, 'Newsletter', 'Groq Llama is structuring editorial newsletter markdown...');
        const newsletterDraft = await this.runGroqNewsletter(transcript, hooks);

        // ⚡ ENGINE 1 (Google Gemini): Fast Post-Processing Critique
        this.emitStatus(io, socketId, 'Critic', 'Gemini is running final stylistic code audits...');
        const [cleanLinkedIn, cleanTwitter, cleanNewsletter] = await Promise.all([
            this.runGeminiCritic(socialDrafts.linkedIn),
            this.runGeminiCritic(socialDrafts.twitter),
            this.runGeminiCritic(newsletterDraft)
        ]);

        this.emitStatus(io, socketId, 'Complete', 'Campaign generation complete.');

        return {
            linkedInPost: cleanLinkedIn,
            twitterThread: cleanTwitter,
            newsletter: cleanNewsletter
        };
    }

    private static emitStatus(io: any, socketId: string, agent: string, status: string) {
        if (io && socketId) {
            io.to(socketId).emit('agent-update', { agent, status });
        }
    }

    private static async runHookAnalyst(transcript: string): Promise<string> {
        const response = await geminiAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${AGENT_PROMPTS.HOOK_ANALYST}\n\nSource Transcript:\n${transcript}`,
        });
        return response.text || '';
    }

    private static async runGroqGhostwriter(hooks: string): Promise<string> {
        // Leverages Llama 3.3 70B's standard OpenAI-compatible chat matrix layout
        const response = await groqText.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: AGENT_PROMPTS.GHOSTWRITER },
                { role: 'user', content: `Core Insights to write from:\n${hooks}` }
            ],
            temperature: 0.7,
        });
        return response.choices[0]?.message?.content || '';
    }

    private static async runGroqNewsletter(transcript: string, hooks: string): Promise<string> {
        const response = await groqText.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: AGENT_PROMPTS.NEWSLETTER_EDITOR },
                { role: 'user', content: `Transcript:\n${transcript}\n\nSelected Insights:\n${hooks}` }
            ],
            temperature: 0.5,
        });
        return response.choices[0]?.message?.content || '';
    }

    private static async runGeminiCritic(draft: string): Promise<string> {
        const response = await geminiAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${AGENT_PROMPTS.CRITIC}\n\nDraft Content to Audit:\n"${draft}"`,
        });
        return response.text || '';
    }

    private static splitSocialContent(rawText: string): { linkedIn: string; twitter: string } {
        const parts = rawText.split('---TWITTER_LINKEDIN_SPLIT---');
        return {
            linkedIn: parts[0]?.trim() || '',
            twitter: parts[1]?.trim() || ''
        };
    }
}