import { Schema, model, Document } from 'mongoose';

// 1. Define the TypeScript Interface representing a Document in MongoDB
export interface ITicket extends Document {
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  customerEmail: string;
  aiResolutionSummary?: string; // Stores a summary of why the AI couldn't solve it
  createdAt: Date;
  updatedAt: Date;
}

// 2. Create the Mongoose Schema matching the interface definitions
const ticketSchema = new Schema<ITicket>(
  {
    title: { 
      type: String, 
      required: [true, 'A ticket must have a title'], 
      trim: true 
    },
    description: { 
      type: String, 
      required: [true, 'A ticket must have a description'] 
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    customerEmail: { 
      type: String, 
      required: [true, 'Please provide a customer contact email'], 
      trim: true, 
      lowercase: true 
    },
    aiResolutionSummary: { 
      type: String,
      default: ''
    },
  },
  { 
    // Automatically creates and manages 'createdAt' and 'updatedAt' fields
    timestamps: true 
  }
);

// 3. Export the compiled model
export const Ticket = model<ITicket>('Ticket', ticketSchema);