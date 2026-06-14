import { connectDB } from './config/db';
import { seedMongoDatabase } from './services/dbService';
import mongoose from 'mongoose';

const runSeed = async () => {
  console.log('Starting seed command...');
  const success = await connectDB();
  if (success) {
    await seedMongoDatabase();
  } else {
    console.error('Skipping MongoDB seeding: database connection failed.');
  }
  await mongoose.disconnect();
  console.log('Seeding process finished.');
};

runSeed();
