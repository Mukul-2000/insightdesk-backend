import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import appRouter from './router/index.router.js';
import { globalErrorHandler } from './middlewares/error.middleware.js';
import { AppError } from './errorhandler/appError.js';
import { connectDatabase } from './config/database.js';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
      origin: '*', // Adjust this to your frontend URL in production (e.g., 'http://localhost:3000')
      methods: ['GET', 'POST']
  }
});

// 🔌 3. Bind the Socket.io instance to Express so your StudioController can fetch it
app.set('socketio', io);

// 🔌 4. Handle generic real-time connection logging
io.on('connection', (socket) => {
  console.log(`🔌 Client connected to studio workspace stream: ${socket.id}`);
  
  socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected from stream: ${socket.id}`);
  });
});

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
  httpServer.listen(PORT, () => {
    console.log(`🚀 Production architecture server running on http://localhost:${PORT}`);
  });
}

export default app;