import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dbUri = process.env.MONGODB_URI;

if (!dbUri) {
  throw new Error('❌ CRITICAL ERROR: MONGODB_URI is missing from your .env file!');
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(dbUri);
    console.log('🍃 Database Connection Established: Connected to MongoDB Atlas Successfully');
  } catch (error) {
    console.error('❌ Database Connection Failure:', error);
    process.exit(1); // Crash the server safely if it cannot connect to the database
  }
};