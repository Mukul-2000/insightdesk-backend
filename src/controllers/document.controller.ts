import express from 'express';
import * as pdfModule from 'pdf-parse'; // Wildcard namespace import
import { TextChunker } from '../util/textChunker.js';
import { GeminiService } from '../services/gemini.service.js';
import { DocumentDao } from '../dao/document.dao.js';
import { AppError } from '../errorhandler/appError.js';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { BUCKET_NAME, s3Client } from '../config/s3.js';
import { ParserService } from '../services/parserService.js';

export class DocumentController {
    static async ingestText(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            if (!req.file) {
                throw new AppError('Please attach a physical document, spreadsheet, image or text file to upload.', 400);
            }
    
            const fileName = req.file.originalname;
    
            // --- STEP 1: PARSE EXTRACTED TEXT VIA UNIFIED PARSER ENGINE ---
            // Automatically accommodates .pdf, .docx, .csv, .md, .txt, and image OCR formats natively
            let rawText = '';
            try {
                rawText = await ParserService.extractText(req.file.buffer, fileName, req.file.mimetype);
            } catch (parseError: any) {
                throw new AppError(`File processing pipeline failure: ${parseError.message}`, 400);
            }
    
            if (!rawText || rawText.trim().length < 20) {
                throw new AppError('Could not extract sufficient text data from the uploaded file (minimum 20 characters required).', 400);
            }
    
            // --- STEP 2: STREAM COMPRESSED FILE BUFFER TO AWS S3 ---
            const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
            const cleanFileName = fileName.replace(/\s+/g, "-");
            const s3Key = `knowledge-base/${uniqueId}-${cleanFileName}`;
    
            const uploadParams = {
                Bucket: BUCKET_NAME,
                Key: s3Key,
                Body: req.file.buffer, // Streams data buffer directly from system execution memory
                ContentType: req.file.mimetype
            };
    
            await s3Client.send(new PutObjectCommand(uploadParams));
            const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    
    
            // --- STEP 3: TEXT CHUNKING & EMBEDDINGS VECTOR SEARCH PROCESSING ---
            const textChunks = TextChunker.splitText(rawText, 120, 20);
            const savedDocuments = [];
    
            for (const chunk of textChunks) {
                const vectorEmbedding = await GeminiService.generateEmbedding(chunk);
    
                const savedChunk = await DocumentDao.saveDocumentChunk({
                    userId: (req as any).user.userId, 
                    fileName,
                    textChunk: chunk,
                    embedding: vectorEmbedding,
                    s3Key: s3Key,  
                    s3Url: fileUrl 
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

    static async getUploadedFiles(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const userId = (req as any).user.userId;

            // Hand off database querying execution to the Document DAO ⚡
            const files = await DocumentDao.getUploadedFiles(userId);

            res.status(200).json({
                success: true,
                data: files
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * SYSTEM-WIDE CASCADING ASSET PURGE
     */
    static async deleteFile(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { s3Key } = req.body;
            const userId = (req as any).user.userId;

            if (!s3Key) {
                throw new AppError('An explicit s3Key body parameter is required to delete target assets.', 400);
            }

            // 1. DROP PHYSICAL OBJECT MANIFEST FROM S3
            try {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: s3Key
                }));
            } catch (awsError) {
                console.warn("AWS S3 target was unreachable or already missing. Moving to data wipe sweep:", awsError);
            }

            // 2. HAND PURGING WORK OVER TO THE DAO LAYER ⚡
            const deleteResult = await DocumentDao.deleteFileChunks(userId, s3Key);

            if (deleteResult.deletedCount === 0) {
                throw new AppError('No corresponding records found to purge from the system indexes.', 404);
            }

            res.status(200).json({
                success: true,
                message: 'Successfully purged document asset from AWS cloud and dropped all vector index chunks.',
                chunksPurged: deleteResult.deletedCount
            });
        } catch (error) {
            next(error);
        }
    }
}