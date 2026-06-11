"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esp32Service = void 0;
// In-memory telemetry cache
let currentStatus = {
    connected: false,
    wifiStatus: 'Disconnected',
    rssi: -100,
    lastRfidUid: 'None',
    lastScanTime: 'Never',
    lastActive: null,
};
exports.esp32Service = {
    getStatus: () => {
        // If we haven't received a heartbeat or scan in 15 seconds, declare offline
        if (currentStatus.lastActive) {
            const now = new Date();
            const diffSeconds = (now.getTime() - currentStatus.lastActive.getTime()) / 1000;
            if (diffSeconds > 15) {
                currentStatus.connected = false;
                currentStatus.wifiStatus = 'Disconnected';
                currentStatus.rssi = -100;
            }
        }
        return currentStatus;
    },
    updateHeartbeat: (wifiStatus, rssi) => {
        currentStatus.connected = true;
        currentStatus.wifiStatus = wifiStatus === 'Connected' ? 'Connected' : 'Disconnected';
        currentStatus.rssi = rssi;
        currentStatus.lastActive = new Date();
    },
    registerScan: (uid) => {
        currentStatus.connected = true;
        currentStatus.lastActive = new Date();
        currentStatus.lastRfidUid = uid;
        currentStatus.lastScanTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    },
};
