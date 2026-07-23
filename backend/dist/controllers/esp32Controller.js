"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatus = exports.testScanLegacy = exports.postHeartbeatLegacy = exports.postHeartbeat = void 0;
const esp32Service_1 = require("../services/esp32Service");
const firebase_1 = require("../config/firebase");
const database_1 = require("firebase/database");
const dbService_1 = require("../services/dbService");
const socketService_1 = require("../services/socketService");
const postHeartbeat = async (req, res) => {
    try {
        const { wifiStatus = 'Connected', rssi = -60, cartId = 'CART_001', weight } = req.body;
        // Register heartbeat in Firestore
        await esp32Service_1.esp32Service.updateHeartbeat(wifiStatus, Number(rssi), cartId, weight !== undefined ? Number(weight) : undefined);
        // Sync RTDB connection status under kiosk_status/CART_001
        const statusPayload = {
            connected: true,
            wifiStatus,
            rssi: Number(rssi),
            lastActive: new Date().toISOString(),
            currentShoppingSession: cartId,
            lastWeightReading: weight !== undefined ? Number(weight) : undefined,
            timestamp: Date.now()
        };
        if (firebase_1.adminRtdb) {
            await firebase_1.adminRtdb.ref(`kiosk_status/${cartId}`).set(statusPayload);
        }
        else {
            const rtdbRef = (0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${cartId}`);
            await (0, database_1.set)(rtdbRef, statusPayload);
        }
        // Emit Socket.IO status event
        try {
            (0, socketService_1.getIO)().emit('esp32_status', statusPayload);
        }
        catch (e) {
            // ignore if socket service is not loaded
        }
        res.status(200).json({ message: "Heartbeat received successfully", success: true });
    }
    catch (error) {
        console.error('❌ Error in /api/esp32/heartbeat:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.postHeartbeat = postHeartbeat;
const postHeartbeatLegacy = async (req, res) => {
    try {
        const { status = 'online', deviceId = 'CART_001', physicalWeight, weight, budget } = req.body;
        const nowIso = new Date().toISOString();
        const nowTime = Date.now();
        // 1. Check for Hardware-Triggered Reset ('D' button on ESP32 cart)
        if (status === 'reset') {
            console.log(`🧹 Hardware-triggered Reset received for ${deviceId}`);
            const resetPayload = {
                connected: true,
                wifiStatus: 'Connected',
                rssi: -50,
                status: 'reset',
                budget: 0,
                physicalWeight: 0,
                lastWeightReading: 0,
                last_scanned_item: null,
                lastRfidUid: '',
                checkout_status: 'pending',
                last_active: nowIso,
                lastActive: nowIso,
                timestamp: nowTime
            };
            if (firebase_1.adminRtdb) {
                await firebase_1.adminRtdb.ref(`kiosk_status/${deviceId}`).set(resetPayload);
            }
            else if (firebase_1.rtdb) {
                const rtdbRef = (0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${deviceId}`);
                await (0, database_1.set)(rtdbRef, resetPayload);
            }
            // Reset backend cart doc
            try {
                const { fetchCartDoc, saveCartDoc } = require('./cartController');
                const cart = await fetchCartDoc(deviceId);
                if (cart) {
                    cart.items = [];
                    cart.totalPrice = 0;
                    cart.totalWeight = 0;
                    cart.expectedWeight = 0;
                    cart.physicalWeight = 0;
                    cart.budget = 0;
                    cart.remainingBudget = 0;
                    cart.status = 'active';
                    cart.weightMatch = true;
                    cart.lastUpdated = nowIso;
                    await saveCartDoc(deviceId, cart);
                }
            }
            catch (e) { }
            try {
                (0, socketService_1.getIO)().emit('esp32_status', resetPayload);
            }
            catch (e) { }
            return res.status(200).json({ message: "Cart reset successful", success: true, status: "reset" });
        }
        const isOnline = status === 'online' || status === 'Connected';
        const weightVal = physicalWeight !== undefined ? Number(physicalWeight) : (weight !== undefined ? Number(weight) : 0);
        const budgetVal = budget !== undefined ? Number(budget) : undefined;
        // 2. Update Firebase RTDB status under kiosk_status/CART_001
        const statusPayload = {
            connected: isOnline,
            wifiStatus: isOnline ? 'Connected' : 'Disconnected',
            rssi: isOnline ? -50 : -100,
            last_active: nowIso,
            lastActive: nowIso,
            physicalWeight: weightVal,
            lastWeightReading: weightVal,
            currentShoppingSession: deviceId,
            timestamp: nowTime
        };
        if (budgetVal !== undefined) {
            statusPayload.budget = budgetVal;
        }
        if (firebase_1.adminRtdb) {
            await firebase_1.adminRtdb.ref(`kiosk_status/${deviceId}`).update(statusPayload);
        }
        else {
            const rtdbRef = (0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${deviceId}`);
            await (0, database_1.set)(rtdbRef, statusPayload);
        }
        // Also update cart doc if present
        try {
            const { fetchCartDoc, saveCartDoc } = require('./cartController');
            const cart = await fetchCartDoc(deviceId);
            if (cart) {
                cart.physicalWeight = weightVal;
                if (budgetVal !== undefined) {
                    cart.budget = budgetVal;
                    cart.remainingBudget = cart.budget - (cart.totalPrice || 0);
                }
                cart.lastSeen = nowIso;
                cart.lastUpdated = nowIso;
                await saveCartDoc(deviceId, cart);
            }
        }
        catch (e) { }
        // 3. Update Firestore esp32Status/status & weight telemetry
        if (isOnline) {
            await esp32Service_1.esp32Service.updateHeartbeat('Connected', -50, deviceId, weightVal);
        }
        // 4. Read payment_status from RTDB for ESP32 hardware polling
        let currentPaymentStatus = 'pending';
        try {
            if (firebase_1.adminRtdb) {
                const snap = await firebase_1.adminRtdb.ref(`kiosk_status/${deviceId}/payment_status`).get();
                if (snap.exists() && snap.val()) {
                    currentPaymentStatus = snap.val();
                }
            }
        }
        catch (e) { }
        // 5. Emit real-time updates via Socket.IO
        try {
            (0, socketService_1.getIO)().emit('esp32_status', { ...statusPayload, payment_status: currentPaymentStatus });
        }
        catch (e) {
            // socket not ready, ignore
        }
        return res.status(200).json({
            message: "Heartbeat received successfully",
            success: true,
            payment_status: currentPaymentStatus,
            physicalWeight: weightVal,
            budget: budgetVal,
            last_active: nowIso
        });
    }
    catch (error) {
        console.error('❌ Error in /api/heartbeat:', error);
        return res.status(500).json({ error: error.message });
    }
};
exports.postHeartbeatLegacy = postHeartbeatLegacy;
const testScanLegacy = async (req, res) => {
    try {
        const { uid } = req.body;
        const cartId = 'CART_001';
        if (!uid) {
            return res.status(400).json({ error: 'Missing RFID UID parameter.' });
        }
        console.log(`📡 Legacy RFID Test-Scan Request. UID: ${uid}`);
        const scanTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        // 1. Save UID and status details to Firebase Realtime Database
        await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, 'esp32Status/lastRfidUid'), uid);
        await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, 'esp32Status/lastScanTime'), scanTime);
        await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, 'esp32Status/connected'), true);
        await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, 'esp32Status/lastActive'), new Date().toISOString());
        // 2. Update Firestore Status
        await esp32Service_1.esp32Service.registerScan(uid);
        // 3. Get product details from catalog
        const product = await dbService_1.dbService.getProductByRfid(uid);
        // 4. Log Scan Event in RFID History
        await dbService_1.dbService.addRFIDScan({
            uid,
            timestamp: new Date(),
            success: !!product,
            productName: product ? product.name : undefined,
        });
        // 5. Add to Cart if cart is active
        const cart = await dbService_1.dbService.getCart(cartId);
        if (cart && cart.status === 'active') {
            if (product) {
                const productIdStr = product._id.toString();
                const itemIndex = cart.items.findIndex((item) => (typeof item.product === 'object' && item.product._id.toString() === productIdStr) ||
                    (typeof item.product === 'string' && item.product === productIdStr));
                if (itemIndex > -1) {
                    cart.items[itemIndex].quantity += 1;
                }
                else {
                    cart.items.push({ product: product._id, quantity: 1 });
                }
                cart.expectedWeight += product.weight;
                cart.physicalWeight += product.weight;
                cart.totalAmount += product.price;
                const savedCart = await dbService_1.dbService.saveCart({
                    cartId,
                    items: cart.items,
                    expectedWeight: cart.expectedWeight,
                    physicalWeight: cart.physicalWeight,
                    totalAmount: cart.totalAmount,
                    weightMismatch: Math.abs(cart.expectedWeight - cart.physicalWeight) > 25,
                });
                // Broadcast cart changes
                (0, socketService_1.emitCartUpdate)(cartId, savedCart);
                (0, socketService_1.emitNotification)({
                    type: 'success',
                    title: 'RFID Scanned (Legacy)',
                    message: `Added: ${product.name} (Rs. ${product.price})`,
                });
            }
            else {
                (0, socketService_1.emitNotification)({
                    type: 'error',
                    title: 'Product Not Found',
                    message: `Unrecognized Tag UID: "${uid}"`,
                });
            }
        }
        // 6. Emit real-time esp32 status update via Socket.IO
        try {
            (0, socketService_1.getIO)().emit('esp32_status', {
                connected: true,
                lastRfidUid: uid,
                lastScanTime: scanTime,
                lastActive: new Date().toISOString()
            });
        }
        catch (e) {
            // socket not ready, ignore
        }
        res.status(200).json({
            success: true,
            uid,
            product: product ? { name: product.name, price: product.price } : null
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.testScanLegacy = testScanLegacy;
const getStatus = async (req, res) => {
    try {
        const status = await esp32Service_1.esp32Service.getStatus();
        res.status(200).json(status);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getStatus = getStatus;
