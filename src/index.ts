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
import { createAdapter } from '@socket.io/redis-adapter'; // 🔌 Added for horizontal socket scaling
import { redisClient } from './config/redis.js'; // 🔌 Added your central Redis client instance

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

// 🚨 ASYNC INITIALIZATION ENGINE: Safely boots DB, connects Redis, maps adapters, and starts server listening
const startServer = async () => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      // 1. Establish primary Redis connection (Pub Channel)
      await redisClient.connect();

      // 2. Duplicate client to create a dedicated channel (Sub Channel)
      const subClient = redisClient.duplicate();
      await subClient.connect();

      // 3. Inject Redis adapter to broker live WebSocket communication channels
      io.adapter(createAdapter(redisClient, subClient));
      console.log('📡 WebSockets successfully linked over Redis scale-out mesh');

      // 4. Fire up the primary MongoDB Atlas connection
      await connectDatabase();

      // 5. Open the HTTP port listener
      httpServer.listen(PORT, () => {
        console.log(`🚀 Production architecture server running.`);
      });
    }
  } catch (error) {
    console.error('Fatal server boot initialization collapse:', error);
    process.exit(1);
  }
};

startServer();

export default app;