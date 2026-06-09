import express from 'express';
import * as pdfModule from 'pdf-parse'; // Wildcard namespace import
import { TextChunker } from '../util/textChunker.js';
import { GeminiService } from '../services/gemini.service.js';
import { DocumentDao } from '../dao/document.dao.js';
import { AppError } from '../errorhandler/appError.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { BUCKET_NAME, s3Client } from '../config/s3.js';

export class DocumentController {
    static async ingestText(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            if (!req.file) {
                throw new AppError('Please attach a physical text or PDF file to upload.', 400);
            }

            const fileName = req.file.originalname;
            let rawText = '';

            // --- STEP 1: PARSE EXTRACTED TEXT ---
            if (req.file.mimetype === 'application/pdf') {
                const moduleRef: any = pdfModule;

                if (moduleRef.PDFParse) {
                    const parser = new moduleRef.PDFParse({ data: req.file.buffer });
                    const parsedData = await parser.getText();
                    rawText = parsedData.text;
                } else {
                    const parseFunc = typeof moduleRef === 'function' ? moduleRef : moduleRef.default;
                    
                    if (typeof parseFunc !== 'function') {
                        console.error('--- UNRECOGNIZED PDF MODULE LAYOUT ---', moduleRef);
                        throw new AppError('The PDF parsing engine failed to locate a valid execution pathway.', 500);
                    }
                    
                    const parsedPdf = await parseFunc(req.file.buffer);
                    rawText = parsedPdf.text;
                }
            } else {
                rawText = req.file.buffer.toString('utf-8');
            }

            if (!rawText || rawText.trim().length < 20) {
                throw new AppError('Could not extract sufficient text data from the uploaded file (minimum 20 characters).', 400);
            }

            // --- STEP 2: STREAM COMPRESSED FILE BUFFER TO AWS S3 ---
            // Generate a secure, unique cloud identifier key
            const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
            const cleanFileName = fileName.replace(/\s+/g, "-");
            const s3Key = `knowledge-base/${uniqueId}-${cleanFileName}`;

            const uploadParams = {
                Bucket: BUCKET_NAME,
                Key: s3Key,
                Body: req.file.buffer, // Streams file buffer directly from system memory
                ContentType: req.file.mimetype
            };

            // Transmit binary payload straight to your AWS Bucket
            await s3Client.send(new PutObjectCommand(uploadParams));

            // Construct the permanent public S3 URL
            const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;


            // --- STEP 3: TEXT CHUNKING & EMBEDDINGS VECTOR SEARCH PROCESSING ---
            // 1. Split the text into overlapping chunk strings
            const textChunks = TextChunker.splitText(rawText, 120, 20);
            const savedDocuments = [];

            // 2. Transpile blocks to vector arrays via Gemini and save to Atlas with S3 tracking metadata
            for (const chunk of textChunks) {
                const vectorEmbedding = await GeminiService.generateEmbedding(chunk);

                const savedChunk = await DocumentDao.saveDocumentChunk({
                    userId: (req as any).user.userId, // Extracted from token guard
                    fileName,
                    textChunk: chunk,
                    embedding: vectorEmbedding,
                    s3Key: s3Key,  // Added for cascading deletions later ⚡
                    s3Url: fileUrl // Added for frontend source citations 🔗
                });

                savedDocuments.push({ id: savedChunk._id });
            }

            // --- STEP 4: CLIENT DISPATCH PAYLOAD ---
            res.status(201).json({
                success: true,
                message: `Successfully processed, hosted on S3, and ingested knowledge context file: ${fileName}`,
                chunksProcessed: savedDocuments.length,
                s3Url: fileUrl,
                data: savedDocuments
            });

        } catch (error) {
            next(error);
        }
    }
}