import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import appRouter from './router/index.router.js';
import { globalErrorHandler } from './middlewares/error.middleware.js';
import { AppError } from './errorhandler/appError.js';
import { connectDatabase } from './config/database.js';
import morgan from 'morgan';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev')); 
}

// Base Health Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'InsightDesk Core is fully operational' });
});

app.use('/api/v1', appRouter);

app.all('/*splat', (req: Request, res: Response, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

// 🚨 FIXED: Only bind server ports and connect databases if NOT running unit tests
if (process.env.NODE_ENV !== 'test') {
  connectDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Production architecture server running on http://localhost:${PORT}`);
  });
}

export default app;