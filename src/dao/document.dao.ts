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
}