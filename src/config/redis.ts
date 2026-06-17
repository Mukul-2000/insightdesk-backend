import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;

export const redisClient = createClient({ url: redisUrl });

redisClient.on('connect', () => console.log('🎯 Central Redis Client Connected'));
redisClient.on('error', (err) => console.error('🚨 Redis Client Error:', err));