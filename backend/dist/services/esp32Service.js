"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esp32Service = void 0;
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("../config/firebase");
const defaultStatus = {
    connected: false,
    wifiStatus: 'Disconnected',
    rssi: -100,
    lastRfidUid: 'None',
    lastScanTime: 'Never',
    lastWeightReading: 0,
    currentShoppingSession: 'None',
    lastActive: null,
};
exports.esp32Service = {
    getStatus: async () => {
        try {
            const docRef = (0, firestore_1.doc)(firebase_1.db, 'esp32Status', 'status');
            const docSnap = await (0, firestore_1.getDoc)(docRef);
            if (!docSnap.exists()) {
                await (0, firestore_1.setDoc)(docRef, defaultStatus);
                return defaultStatus;
            }
            const data = docSnap.data();
            if (data.lastActive) {
                const lastActiveTime = new Date(data.lastActive).getTime();
                const diffSeconds = (Date.now() - lastActiveTime) / 1000;
                if (diffSeconds > 15) {
                    const updated = {
                        ...data,
                        connected: false,
                        wifiStatus: 'Disconnected',
                        rssi: -100
                    };
                    await (0, firestore_1.setDoc)(docRef, updated, { merge: true });
                    return updated;
                }
            }
            return data;
        }
        catch (err) {
            console.error('Failed to get ESP32 status from Firestore:', err);
            return defaultStatus;
        }
    },
    updateHeartbeat: async (wifiStatus, rssi, cartId, weight) => {
        try {
            const docRef = (0, firestore_1.doc)(firebase_1.db, 'esp32Status', 'status');
            const updateData = {
                connected: true,
                wifiStatus: wifiStatus === 'Connected' ? 'Connected' : 'Disconnected',
                rssi,
                lastActive: new Date().toISOString(),
            };
            if (cartId)
                updateData.currentShoppingSession = cartId;
            if (weight !== undefined)
                updateData.lastWeightReading = weight;
            await (0, firestore_1.setDoc)(docRef, updateData, { merge: true });
        }
        catch (err) {
            console.error('Failed to update ESP32 heartbeat in Firestore:', err);
        }
    },
    registerScan: async (uid) => {
        try {
            const docRef = (0, firestore_1.doc)(firebase_1.db, 'esp32Status', 'status');
            await (0, firestore_1.setDoc)(docRef, {
                connected: true,
                lastActive: new Date().toISOString(),
                lastRfidUid: uid,
                lastScanTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            }, { merge: true });
        }
        catch (err) {
            console.error('Failed to register scan in Firestore:', err);
        }
    },
    registerWeight: async (cartId, weight) => {
        try {
            const docRef = (0, firestore_1.doc)(firebase_1.db, 'esp32Status', 'status');
            await (0, firestore_1.setDoc)(docRef, {
                connected: true,
                lastActive: new Date().toISOString(),
                lastWeightReading: weight,
                currentShoppingSession: cartId,
            }, { merge: true });
        }
        catch (err) {
            console.error('Failed to register weight in Firestore:', err);
        }
    },
};
