import express from 'express';
import * as pdfModule from 'pdf-parse'; // Wildcard namespace import
import { TextChunker } from '../util/textChunker.js';
import { GeminiService } from '../services/gemini.service.js';
import { DocumentDao } from '../dao/document.dao.js';
import { AppError } from '../errorhandler/appError.js';

export class DocumentController {
    static async ingestText(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            if (!req.file) {
                throw new AppError('Please attach a physical text or PDF file to upload.', 400);
            }

            const fileName = req.file.originalname;
            let rawText = '';

            if (req.file.mimetype === 'application/pdf') {
                const moduleRef: any = pdfModule;

                // 🚨 ADAPTIVE PARSER RESOLVER:
                // Case 1: Check if the package is using the modern class constructor layout
                if (moduleRef.PDFParse) {
                    const parser = new moduleRef.PDFParse({ data: req.file.buffer });
                    const parsedData = await parser.getText();
                    rawText = parsedData.text;
                } 
                // Case 2: Fall back to the classic direct function or .default wrapper function
                else {
                    const parseFunc = typeof moduleRef === 'function' ? moduleRef : moduleRef.default;
                    
                    if (typeof parseFunc !== 'function') {
                        // Diagnostic logger to reveal the internal structure if everything fails
                        console.error('--- UNRECOGNIZED PDF MODULE LAYOUT ---', moduleRef);
                        throw new AppError('The PDF parsing engine failed to locate a valid execution pathway.', 500);
                    }
                    
                    const parsedPdf = await parseFunc(req.file.buffer);
                    rawText = parsedPdf.text;
                }
            } else {
                // Flat standard conversion for native text files
                rawText = req.file.buffer.toString('utf-8');
            }

            if (!rawText || rawText.trim().length < 20) {
                throw new AppError('Could not extract sufficient text data from the uploaded file (minimum 20 characters).', 400);
            }

            // 1. Split the text into overlapping chunk strings
            const textChunks = TextChunker.splitText(rawText, 120, 20);
            const savedDocuments = [];

            // 2. Transpile blocks to vector arrays via Gemini and save to Atlas
            for (const chunk of textChunks) {
                const vectorEmbedding = await GeminiService.generateEmbedding(chunk);

                const savedChunk = await DocumentDao.saveDocumentChunk({
                    userId: (req as any).user.userId,
                    fileName,
                    textChunk: chunk,
                    embedding: vectorEmbedding
                });

                savedDocuments.push({ id: savedChunk._id });
            }

            res.status(201).json({
                success: true,
                message: `Successfully processed and ingested knowledge context file: ${fileName}`,
                chunksProcessed: savedDocuments.length,
                data: savedDocuments
            });

        } catch (error) {
            next(error);
        }
    }
}