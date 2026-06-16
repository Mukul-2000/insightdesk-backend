import { Request, Response } from 'express';
import { WhisperService } from '../services/whisperService.js';
import { AgentOrchestrator } from '../services/agentOrchestrator.js';

export class StudioController {
    static async generateCampaign(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No media file detected in the payload request.' });
            }

            const socketId = req.body.socketId; 
            const io = req.app.get('socketio');

            // 1. Send the raw buffer and original name directly to the transcription service
            const transcript = await WhisperService.transcribeMedia(req.file.buffer, req.file.originalname);


            // ☁️ 2. BACKUP TO S3: Stream the buffer to your cloud storage
            // const s3Url = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);

            // 🗄️ 3. DATABASE RECORD: Log it so it appears in the "Manage Files" view
            // const loggedFile = await FileModel.create({
            //     name: req.file.originalname,
            //     url: s3Url,
            //     size: req.file.size,
            //     mimeType: req.file.mimetype,
            //     category: 'audio/video',
            //     userId: userId
            // });


            // 4. Fire the sequential Agent fleet using your text state
            const campaignAssets = await AgentOrchestrator.runPipeline(transcript, io, socketId);

            return res.status(200).json({
                success: true,
                data: campaignAssets
            });

        } catch (error: any) {
            console.error('Studio Controller Error:', error);
            return res.status(500).json({ error: error.message || 'Internal Production Server Error' });
        }
    }
}