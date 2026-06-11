import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export let isInMemoryFallback = false;

export const connectDB = async (): Promise<boolean> => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartcart';
  
  console.log('Connecting to database...');
  
  try {
    // Set connection timeout to 4 seconds so it falls back quickly if MongoDB isn't running
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log('✨ MongoDB Connected successfully!');
    isInMemoryFallback = false;
    return true;
  } catch (error: any) {
    console.warn('⚠️ MongoDB connection failed. Reason:', error.message);
    console.warn('🚀 Falling back to fully-functional IN-MEMORY DATABASE for demonstration!');
    isInMemoryFallback = true;
    return false;
  }
};
