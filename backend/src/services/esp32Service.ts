import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface ESP32Status {
  connected: boolean;
  wifiStatus: 'Connected' | 'Disconnected';
  rssi: number;
  lastRfidUid: string;
  lastScanTime: string;
  lastWeightReading: number;
  currentShoppingSession: string;
  lastActive: string | null;
}

const defaultStatus: ESP32Status = {
  connected: false,
  wifiStatus: 'Disconnected',
  rssi: -100,
  lastRfidUid: 'None',
  lastScanTime: 'Never',
  lastWeightReading: 0,
  currentShoppingSession: 'None',
  lastActive: null,
};

export const esp32Service = {
  getStatus: async (): Promise<ESP32Status> => {
    try {
      const docRef = doc(db, 'esp32Status', 'status');
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, defaultStatus);
        return defaultStatus;
      }
      const data = docSnap.data() as ESP32Status;
      
      if (data.lastActive) {
        const lastActiveTime = new Date(data.lastActive).getTime();
        const diffSeconds = (Date.now() - lastActiveTime) / 1000;
        if (diffSeconds > 15) {
          const updated = {
            ...data,
            connected: false,
            wifiStatus: 'Disconnected' as const,
            rssi: -100
          };
          await setDoc(docRef, updated, { merge: true });
          return updated;
        }
      }
      return data;
    } catch (err) {
      console.error('Failed to get ESP32 status from Firestore:', err);
      return defaultStatus;
    }
  },

  updateHeartbeat: async (wifiStatus: string, rssi: number, cartId?: string, weight?: number) => {
    try {
      const docRef = doc(db, 'esp32Status', 'status');
      const updateData: any = {
        connected: true,
        wifiStatus: wifiStatus === 'Connected' ? 'Connected' : 'Disconnected',
        rssi,
        lastActive: new Date().toISOString(),
      };
      if (cartId) updateData.currentShoppingSession = cartId;
      if (weight !== undefined) updateData.lastWeightReading = weight;
      await setDoc(docRef, updateData, { merge: true });
    } catch (err) {
      console.error('Failed to update ESP32 heartbeat in Firestore:', err);
    }
  },

  registerScan: async (uid: string) => {
    try {
      const docRef = doc(db, 'esp32Status', 'status');
      await setDoc(docRef, {
        connected: true,
        lastActive: new Date().toISOString(),
        lastRfidUid: uid,
        lastScanTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }, { merge: true });
    } catch (err) {
      console.error('Failed to register scan in Firestore:', err);
    }
  },

  registerWeight: async (cartId: string, weight: number) => {
    try {
      const docRef = doc(db, 'esp32Status', 'status');
      await setDoc(docRef, {
        connected: true,
        lastActive: new Date().toISOString(),
        lastWeightReading: weight,
        currentShoppingSession: cartId,
      }, { merge: true });
    } catch (err) {
      console.error('Failed to register weight in Firestore:', err);
    }
  },
};
