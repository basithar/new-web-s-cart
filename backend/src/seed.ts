import { connectDB } from './config/db';
import { seedMongoDatabase } from './services/dbService';
import mongoose from 'mongoose';

const runSeed = async () => {
  console.log('Starting seed command...');
  const success = await connectDB();
  if (success) {
    await seedMongoDatabase();
  } else {
    console.log('Skipping MongoDB seeding (in-memory mode is auto-seeded at runtime).');
  }
  await mongoose.disconnect();
  console.log('Seeding process finished.');
};

runSeed();
