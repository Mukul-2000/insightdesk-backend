import OpenAI from 'openai';

// 🔌 Hook the OpenAI SDK directly into Groq's ultra-fast free server layer
const groq = new OpenAI({ 
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1' 
});

export class WhisperService {
    /**
     * Streams raw memory buffers to Groq's Whisper architecture for instant free transcription
     */
    static async transcribeMedia(fileBuffer: Buffer, originalName: string): Promise<string> {
        try {
            const fileObject = await OpenAI.toFile(fileBuffer, originalName);

            const response = await groq.audio.transcriptions.create({
                file: fileObject,
                model: 'whisper-large-v3-turbo', // ✨ Leveraging Groq's optimized turbo-audio engine
                temperature: 0.2,
            });

            return response.text;
        } catch (error) {
            console.error('Groq Audio Transcriber Node Failure:', error);
            throw new Error('The Groq Whisper engine failed to parse the incoming audio stream memory asset.');
        }
    }
}