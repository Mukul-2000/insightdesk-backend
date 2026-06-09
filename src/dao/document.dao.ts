import mongoose from 'mongoose';
import { KnowledgeDocument, IDocument } from '../models/document.model.js';

export class DocumentDao {
  /**
   * Saves a text chunk alongside its high-dimensional vector representation
   */
  static async saveDocumentChunk(docData: Partial<IDocument>): Promise<IDocument> {
    return await KnowledgeDocument.create(docData);
  }

  static async vectorSearch(queryVector: number[], userId: string, limit: number = 3) {
    const pipeline = [
      {
        $vectorSearch: {
          index: "autoembed_index",
          path: "embedding",
          queryVector: queryVector,
          numCandidates: 100,
          limit: limit * 5 // 👈 Pull slightly more chunks to ensure user files aren't cut off by match filters
        }
      },
      {
        // 🚨 SECURE MULTI-TENANCY FILTER STAGE
        $match: {
          userId: new mongoose.Types.ObjectId(userId) // Only keep chunks belonging to THIS user
        }
      },
      {
        $limit: limit // Narrow down to the requested chunk count limit structure
      }
    ];

    return await KnowledgeDocument.aggregate(pipeline);
  }

  static async portfolioVectorSearch(queryVector: number[], limit: number = 3) {
    const pipeline = [
      {
        $vectorSearch: {
          index: "autoembed_index",
          path: "embedding",
          queryVector: queryVector,
          numCandidates: 100,
          limit: limit * 5 // 👈 Pull slightly more chunks to ensure user files aren't cut off by match filters
        }
      },
      {
        $limit: limit // Narrow down to the requested chunk count limit structure
      }
    ];

    return await KnowledgeDocument.aggregate(pipeline);
  }

  /**
     * AGGREGATE UNIQUE STORAGE DOCUMENTS BY USER REFERENCE
     */
  static async getUploadedFiles(userId: string): Promise<any[]> {
    return await KnowledgeDocument.aggregate([
      // 1. Isolate entries tied strictly to the target user account
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      // 2. Collapse vector chunk records down into unique root document rows
      {
        $group: {
          _id: "$s3Key",
          fileName: { $first: "$fileName" },
          s3Url: { $first: "$s3Url" },
          uploadedAt: { $first: "$createdAt" },
          totalChunks: { $sum: 1 } // Sum up how many vector blocks this file occupies
        }
      },
      // 3. Keep newest file arrays on top
      { $sort: { uploadedAt: -1 } }
    ]);
  }

  /**
   * CLEAR ALL CHUNKS ASSOCIATED WITH A TARGET S3 PATH KEY
   */
  static async deleteFileChunks(userId: string, s3Key: string): Promise<{ deletedCount: number }> {
    return await KnowledgeDocument.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
      s3Key: s3Key
    });
  }
}