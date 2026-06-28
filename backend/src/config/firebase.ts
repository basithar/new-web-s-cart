import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { initializeApp as initAdminApp, cert as adminCert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { getDatabase as getAdminDatabase } from 'firebase-admin/database';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://smart-cart-674c5-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

console.log('🔥 Initializing Firebase Client SDK for Project:', firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Initialize Firebase Admin SDK if service account is available in environment
let adminDb: any = null;
let adminRtdb: any = null;
let isUsingAdminSDK = false;

try {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (privateKey && clientEmail && projectId) {
    initAdminApp({
      credential: adminCert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      databaseURL: firebaseConfig.databaseURL
    });
    adminDb = getAdminFirestore();
    adminRtdb = getAdminDatabase();
    isUsingAdminSDK = true;
    console.log('🔥 Firebase Admin SDK initialized successfully!');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initAdminApp({
      credential: adminCert(serviceAccount),
      databaseURL: firebaseConfig.databaseURL
    });
    adminDb = getAdminFirestore();
    adminRtdb = getAdminDatabase();
    isUsingAdminSDK = true;
    console.log('🔥 Firebase Admin SDK initialized from service account JSON string!');
  } else {
    console.log('ℹ️ No Firebase Admin service account keys found in environment variables. Falling back to Firebase Client SDK.');
  }
} catch (error: any) {
  console.error('⚠️ Failed to initialize Firebase Admin SDK:', error.message);
}

// Unified Database Helpers for Cart Operations
export const getCartDoc = async (cartId: string): Promise<any> => {
  if (isUsingAdminSDK && adminDb) {
    const docSnap = await adminDb.collection('carts').doc(cartId).get();
    return docSnap.exists ? docSnap.data() : null;
  } else {
    const ref = doc(db, 'carts', cartId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  }
};

export const saveCartDoc = async (cartId: string, data: any): Promise<void> => {
  if (isUsingAdminSDK && adminDb) {
    await adminDb.collection('carts').doc(cartId).set(data);
  } else {
    const ref = doc(db, 'carts', cartId);
    await setDoc(ref, data);
  }
};

export { adminDb, adminRtdb, isUsingAdminSDK };
export default app;
