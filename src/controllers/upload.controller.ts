import { Request, Response, NextFunction } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET_NAME, s3Client } from "../config/s3.js";

export class UploadController {
  static async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;

      if (!file) {
        res.status(400).json({ success: false, message: "No file uploaded." });
        return;
      }

      // 1. Generate a completely unique, safe filename key
      const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const cleanFileName = file.originalname.replace(/\s+/g, "-");
      const s3Key = `knowledge-base/${uniqueId}-${cleanFileName}`;

      // 2. Setup the AWS S3 Put Object Upload Parameters
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: file.buffer, // Buffered document data from Multer memory storage
        ContentType: file.mimetype,
      };

      // 3. Fire the upload execution command to your cloud bucket
      await s3Client.send(new PutObjectCommand(uploadParams));

      // 4. Construct the cloud asset file URL matching your bucket region matrix
      const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

      res.status(200).json({
        success: true,
        message: "Document successfully uploaded to AWS S3 cloud storage.",
        data: {
          fileName: file.originalname,
          s3Key: s3Key,
          url: fileUrl,
          mimeType: file.mimetype,
          size: file.size,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}