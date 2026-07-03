import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { connectRabbitMQ } from '../config/rabbitmq.js';
import { redisClient } from '../config/redis.js';
import { AgentOrchestrator } from './agentOrchestrator.js';

/**
 * Worker Process: Orchestrates heavy AI pipelines without blocking the API.
 * Communicates progress to the API process via Redis Pub/Sub.
 */
const startWorker = async () => {
    try {
        // 1. Initialize RabbitMQ Connection
        const channel = await connectRabbitMQ();
        console.log('👷 Campaign Worker connected to RabbitMQ');

        // 2. Initialize Redis Connection for Socket.io Adapter
        // Both clients must be connected to bridge the Pub/Sub gap between processes
        if (!redisClient.isOpen) await redisClient.connect();
        const subClient = redisClient.duplicate();
        await subClient.connect();

        // 3. Create a local Socket.io instance and attach the Redis Adapter
        // This allows this process to emit events that the API process will hear
        const io = new Server();
        io.adapter(createAdapter(redisClient, subClient));

        // 4. Consume tasks from the campaign queue
        await channel.assertQueue('campaign_queue', { durable: true });
        
        channel.consume('campaign_queue', async (msg) => {
            if (!msg) return;

            const { transcript, socketId } = JSON.parse(msg.content.toString());
            
            console.log(`🚀 Starting pipeline for socket: ${socketId}`);

            try {
                // Execute the heavy pipeline
                // Note: Ensure AgentOrchestrator methods use the passed 'io' correctly
                await AgentOrchestrator.runPipeline(transcript, io, socketId);
                
                // Task succeeded, acknowledge the message
                channel.ack(msg);
                console.log(`✅ Campaign task completed for: ${socketId}`);
                
            } catch (error) {
                console.error("❌ Worker pipeline failed:", error);
                
                // If AI service is down, requeue the message (nack)
                // { requeue: true } puts it back at the end of the queue
                channel.nack(msg, false, true); 
            }
        });

    } catch (error) {
        console.error('Fatal Worker Initialization Error:', error);
        process.exit(1);
    }
};

startWorker();