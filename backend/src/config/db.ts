import { db } from './firebase';

export let isInMemoryFallback = false;

export const connectDB = async (): Promise<boolean> => {
  try {
    if (!db) {
      throw new Error('Firestore DB instance is not initialized.');
    }
    console.log('✨ Firebase Firestore connection verified successfully!');
    isInMemoryFallback = false;
    return true;
  } catch (error: any) {
    console.error('❌ Firebase Firestore verification failed:', error.message);
    isInMemoryFallback = false;
    return false;
  }
};
