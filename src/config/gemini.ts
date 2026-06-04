import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('❌ CRITICAL ERROR: GEMINI_API_KEY is missing from your .env file!');
}

// Initialize the official Google Gen AI Client
export const ai = new GoogleGenAI({ apiKey });

// We'll use the fast, cost-efficient flash model perfect for text generation and RAG
export const GEMINI_MODEL = 'gemini-2.5-flash';