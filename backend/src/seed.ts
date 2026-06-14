import { connectDB } from './config/db';
import { seedMongoDatabase } from './services/dbService';

const runSeed = async () => {
  console.log('Starting seed command...');
  const success = await connectDB();
  if (success) {
    await seedMongoDatabase();
  } else {
    console.error('Skipping Firestore seeding: database connection failed.');
  }
  console.log('Seeding process finished.');
  process.exit(0);
};

runSeed();
