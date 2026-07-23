"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchCheckoutCart = exports.resumeCartSession = exports.updateCartItemQuantity = exports.updateCartBudget = exports.startCart = exports.payCart = exports.postHeartbeat = exports.stopShoppingSession = exports.removeItemFromCart = exports.scanRfidCard = exports.getProductByUid = exports.getCart = exports.itemsDB = void 0;
const firebase_1 = require("../config/firebase");
const database_1 = require("firebase/database");
const socketService_1 = require("../services/socketService");
// Hardcoded Items Database
exports.itemsDB = {
    "F1CD0C01": { name: "Keeri Samba", price: 1300, weight: 5000 },
    "A5480D01": { name: "Maliban Chocolate Biscuit", price: 240, weight: 200 },
    "6BDC0D01": { name: "Ritzbury", price: 450, weight: 400 },
    "5DF03806": { name: "LUX Soap", price: 170, weight: 100 },
    "B6930D01": { name: "Brown Sugar", price: 140, weight: 500 },
    "8B450C01": { name: "Signal Paste", price: 280, weight: 160 },
    "E4320C01": { name: "Kottu Mee", price: 135, weight: 80 },
    "CE410E01": { name: "Highland IceCrm", price: 650, weight: 550 }
};
const fetchCartDoc = async (cartId) => {
    const data = await (0, firebase_1.getCartDoc)(cartId);
    if (data) {
        const sanitizedCart = { ...data };
        // Validate items array: filter out old product reference objects
        if (!Array.isArray(sanitizedCart.items)) {
            sanitizedCart.items = [];
        }
        else {
            sanitizedCart.items = sanitizedCart.items.filter((item) => item && typeof item === 'object' && typeof item.uid === 'string');
        }
        // Map old status values to the new spec
        if (!sanitizedCart.status ||
            ['active', 'stopped', 'completed', 'pending', 'ready_for_payment', 'weight_mismatch'].includes(sanitizedCart.status)) {
            sanitizedCart.status = 'shopping';
        }
        // Default missing numeric parameters
        sanitizedCart.budget = Number(sanitizedCart.budget) || 3500;
        sanitizedCart.totalPrice = sanitizedCart.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
        sanitizedCart.totalWeight = sanitizedCart.items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
        sanitizedCart.physicalWeight = Number(sanitizedCart.physicalWeight) || 0;
        sanitizedCart.remainingBudget = sanitizedCart.budget - sanitizedCart.totalPrice;
        sanitizedCart.weightMatch = sanitizedCart.weightMatch === true;
        sanitizedCart.lastUpdated = sanitizedCart.lastUpdated || new Date().toISOString();
        return sanitizedCart;
    }
    const defaultCart = {
        status: 'shopping',
        budget: 3500,
        remainingBudget: 3500,
        totalPrice: 0,
        totalWeight: 0,
        physicalWeight: 0,
        weightMatch: false,
        items: [],
        lastUpdated: new Date().toISOString()
    };
    await (0, firebase_1.saveCartDoc)(cartId, defaultCart);
    return defaultCart;
};
// 1. GET /api/cart/:cartId
const getCart = async (req, res) => {
    try {
        const { cartId = 'CART_001' } = req.params;
        const cart = await fetchCartDoc(cartId);
        res.status(200).json(cart);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getCart = getCart;
// GET /api/product/:uid
const getProductByUid = async (req, res) => {
    try {
        const { uid } = req.params;
        const cartId = 'CART_001';
        if (!uid) {
            return res.status(400).json({ success: false, error: 'Missing product UID parameter.' });
        }
        const itemTemplate = exports.itemsDB[uid] || Object.values(exports.itemsDB).find(i => i.name.toLowerCase() === uid.toLowerCase());
        if (!itemTemplate) {
            return res.status(404).json({ success: false, error: `Product with UID ${uid} not found.` });
        }
        const scanPayload = {
            uid,
            name: itemTemplate.name,
            price: itemTemplate.price,
            weight: itemTemplate.weight,
            timestamp: Date.now(),
            scanId: `${uid}_${Date.now()}`
        };
        // Simultaneously write this scan event to Firebase Realtime Database
        try {
            if (firebase_1.adminRtdb) {
                await firebase_1.adminRtdb.ref(`kiosk_status/${cartId}/last_scanned_item`).set(scanPayload);
                await firebase_1.adminRtdb.ref(`kiosk_status/${cartId}`).update({
                    lastRfidUid: uid,
                    lastScanTime: new Date().toLocaleTimeString(),
                    lastActive: new Date().toISOString(),
                    connected: true,
                    timestamp: Date.now()
                });
            }
            else if (firebase_1.rtdb) {
                await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${cartId}/last_scanned_item`), scanPayload);
                await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${cartId}/lastRfidUid`), uid);
            }
        }
        catch (rtdbErr) {
            console.error('Error writing last_scanned_item to RTDB:', rtdbErr);
        }
        // Also update cart document
        try {
            const cart = await fetchCartDoc(cartId);
            const existingIndex = cart.items.findIndex(item => item.uid === uid);
            if (existingIndex < 0) {
                cart.items.push({
                    uid,
                    name: itemTemplate.name,
                    price: itemTemplate.price,
                    weight: itemTemplate.weight
                });
            }
            cart.totalPrice = cart.items.reduce((sum, i) => sum + i.price, 0);
            cart.totalWeight = cart.items.reduce((sum, i) => sum + i.weight, 0);
            cart.remainingBudget = cart.budget - cart.totalPrice;
            cart.lastUpdated = new Date().toISOString();
            await (0, firebase_1.saveCartDoc)(cartId, cart);
            (0, socketService_1.emitCartUpdate)(cartId, cart);
        }
        catch (cartErr) {
            console.error('Error updating cart doc on product fetch:', cartErr);
        }
        return res.status(200).json({
            success: true,
            name: itemTemplate.name,
            price: itemTemplate.price,
            weight: itemTemplate.weight
        });
    }
    catch (error) {
        console.error('Error in getProductByUid:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
exports.getProductByUid = getProductByUid;
// 2. POST /api/rfid/scan
const scanRfidCard = async (req, res) => {
    try {
        const { uid, cartId = 'CART_001', weight = 0 } = req.body;
        if (!uid) {
            return res.status(400).json({ success: false, error: 'Missing RFID UID parameter.' });
        }
        const itemTemplate = exports.itemsDB[uid];
        if (!itemTemplate) {
            return res.status(404).json({ success: false, error: 'Item not found in database' });
        }
        const scanPayload = {
            uid,
            name: itemTemplate.name,
            price: itemTemplate.price,
            weight: itemTemplate.weight,
            timestamp: Date.now(),
            scanId: `${uid}_${Date.now()}`
        };
        try {
            const { esp32Service } = require('../services/esp32Service');
            await esp32Service.registerScan(uid);
            // Update telemetry reading & last_scanned_item on kiosk_status/CART_001
            if (firebase_1.adminRtdb) {
                await firebase_1.adminRtdb.ref(`kiosk_status/${cartId}/last_scanned_item`).set(scanPayload);
                await firebase_1.adminRtdb.ref(`kiosk_status/${cartId}`).update({
                    lastRfidUid: uid,
                    lastScanTime: new Date().toLocaleTimeString(),
                    lastWeightReading: Number(weight),
                    lastActive: new Date().toISOString(),
                    connected: true,
                    timestamp: Date.now()
                });
            }
            else if (firebase_1.rtdb) {
                await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${cartId}/last_scanned_item`), scanPayload);
                await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${cartId}/lastRfidUid`), uid);
                await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${cartId}/lastScanTime`), new Date().toLocaleTimeString());
                await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${cartId}/lastWeightReading`), Number(weight));
                await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${cartId}/lastActive`), new Date().toISOString());
                await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${cartId}/connected`), true);
                await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${cartId}/timestamp`), Date.now());
            }
        }
        catch (e) {
            console.error('Failed to register scan logs:', e);
        }
        res.status(200).json({
            success: true,
            message: 'Item registered in log (Batch mode active - cart unmodified)',
            item: {
                name: itemTemplate.name,
                price: itemTemplate.price,
                weight: itemTemplate.weight
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.scanRfidCard = scanRfidCard;
// 3. POST /api/rfid/remove
const removeItemFromCart = async (req, res) => {
    try {
        const { uid, cartId = 'CART_001', weight = 0 } = req.body;
        if (!uid) {
            return res.status(400).json({ success: false, error: 'Missing RFID UID parameter.' });
        }
        // Update telemetry reading on kiosk_status/CART_001
        try {
            if (firebase_1.adminRtdb) {
                await firebase_1.adminRtdb.ref(`kiosk_status/${cartId}`).update({
                    lastWeightReading: Number(weight),
                    lastActive: new Date().toISOString(),
                    connected: true,
                    timestamp: Date.now()
                });
            }
            else if (firebase_1.rtdb) {
                await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${cartId}/lastWeightReading`), Number(weight));
                await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${cartId}/lastActive`), new Date().toISOString());
                await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${cartId}/connected`), true);
                await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${cartId}/timestamp`), Date.now());
            }
        }
        catch (e) {
            console.error('Failed to sync esp32Status in remove:', e);
        }
        res.status(200).json({
            success: true,
            message: 'Remove registered (Batch mode active - cart unmodified)'
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.removeItemFromCart = removeItemFromCart;
// 4. POST /api/cart/stop
const stopShoppingSession = async (req, res) => {
    try {
        const { cartId = 'CART_001', physicalWeight = 0 } = req.body;
        const cart = await fetchCartDoc(cartId);
        // Recalculate totalPrice and totalWeight to ensure they match items array
        cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price, 0);
        cart.totalWeight = cart.items.reduce((sum, item) => sum + item.weight, 0);
        cart.remainingBudget = cart.budget - cart.totalPrice;
        const weightDifference = Math.abs(cart.totalWeight - Number(physicalWeight));
        const isValid = weightDifference <= 50; // ±50g tolerance limit
        if (isValid) {
            cart.status = 'checkout';
            cart.weightMatch = true;
            cart.physicalWeight = Number(physicalWeight);
            cart.lastUpdated = new Date().toISOString();
            await (0, firebase_1.saveCartDoc)(cartId, cart);
            (0, socketService_1.emitCartUpdate)(cartId, cart);
            return res.status(200).json({
                weightMatch: true,
                totalPrice: cart.totalPrice,
                totalWeight: cart.totalWeight
            });
        }
        else {
            cart.status = 'shopping';
            cart.weightMatch = false;
            cart.physicalWeight = Number(physicalWeight);
            cart.lastUpdated = new Date().toISOString();
            await (0, firebase_1.saveCartDoc)(cartId, cart);
            (0, socketService_1.emitCartUpdate)(cartId, cart);
            return res.status(200).json({
                weightMatch: false,
                difference: weightDifference,
                message: "Weight mismatch. Please scan unscanned items."
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.stopShoppingSession = stopShoppingSession;
// 5. POST /api/esp32/heartbeat
const postHeartbeat = async (req, res) => {
    try {
        const { cartId = 'CART_001', physicalWeight, weight = 0, budget = 3500, wifiStatus = 'Connected', rssi = -50 } = req.body;
        const weightVal = physicalWeight !== undefined ? Number(physicalWeight) : Number(weight);
        const nowIso = new Date().toISOString();
        const cart = await fetchCartDoc(cartId);
        cart.physicalWeight = weightVal;
        cart.budget = Number(budget);
        cart.remainingBudget = cart.budget - cart.totalPrice;
        cart.lastSeen = nowIso;
        cart.lastUpdated = nowIso;
        await (0, firebase_1.saveCartDoc)(cartId, cart);
        // Sync ESP32 connection state with Realtime Database and Firestore status doc
        try {
            const statusPayload = {
                connected: true,
                wifiStatus,
                rssi,
                last_active: nowIso,
                lastActive: nowIso,
                physicalWeight: weightVal,
                lastWeightReading: weightVal,
                currentShoppingSession: cartId,
                timestamp: Date.now()
            };
            // Update RTDB under kiosk_status/CART_001
            if (firebase_1.adminRtdb) {
                await firebase_1.adminRtdb.ref(`kiosk_status/${cartId}`).update(statusPayload);
            }
            else if (firebase_1.rtdb) {
                await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${cartId}`), statusPayload);
            }
            // Update Firestore
            const { esp32Service } = require('../services/esp32Service');
            await esp32Service.updateHeartbeat(wifiStatus, Number(rssi), cartId, weightVal);
        }
        catch (e) {
            console.error('Failed to sync esp32Status in postHeartbeat:', e);
        }
        res.status(200).json({ success: true, physicalWeight: weightVal, last_active: nowIso });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.postHeartbeat = postHeartbeat;
// 6. POST /api/cart/pay
const payCart = async (req, res) => {
    try {
        const { cartId = 'CART_001', paymentMethod = 'card' } = req.body;
        const cart = await fetchCartDoc(cartId);
        cart.status = 'paid';
        cart.paidAt = new Date().toISOString();
        cart.paymentMethod = paymentMethod;
        cart.lastUpdated = new Date().toISOString();
        await (0, firebase_1.saveCartDoc)(cartId, cart);
        (0, socketService_1.emitCartUpdate)(cartId, cart);
        res.status(200).json({ success: true, message: "Payment successful" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.payCart = payCart;
// 7. POST /api/cart/start
const startCart = async (req, res) => {
    try {
        const { cartId = 'CART_001' } = req.body;
        const defaultCart = {
            cartId,
            status: 'shopping',
            budget: 3500,
            remainingBudget: 3500,
            totalPrice: 0,
            totalWeight: 0,
            physicalWeight: 0,
            weightMatch: false,
            items: [],
            lastUpdated: new Date().toISOString(),
            lastSeen: new Date().toISOString()
        };
        await (0, firebase_1.saveCartDoc)(cartId, defaultCart);
        (0, socketService_1.emitCartUpdate)(cartId, defaultCart);
        res.status(200).json({ success: true, cart: defaultCart });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.startCart = startCart;
// 8. POST /api/cart/budget
const updateCartBudget = async (req, res) => {
    try {
        const { cartId = 'CART_001', budget } = req.body;
        const cart = await fetchCartDoc(cartId);
        cart.budget = Number(budget);
        cart.remainingBudget = cart.budget - cart.totalPrice;
        cart.lastUpdated = new Date().toISOString();
        await (0, firebase_1.saveCartDoc)(cartId, cart);
        (0, socketService_1.emitCartUpdate)(cartId, cart);
        res.status(200).json({ success: true, cart });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.updateCartBudget = updateCartBudget;
// 9. POST /api/cart/quantity
const updateCartItemQuantity = async (req, res) => {
    try {
        const { cartId = 'CART_001', productId, quantity } = req.body;
        const cart = await fetchCartDoc(cartId);
        const itemTemplate = exports.itemsDB[productId] || Object.values(exports.itemsDB).find(i => i.name === productId);
        const uid = productId;
        // Remove all existing instances of this item
        cart.items = (cart.items || []).filter((item) => item.uid !== uid);
        if (quantity > 0 && itemTemplate) {
            for (let i = 0; i < quantity; i++) {
                cart.items.push({
                    uid,
                    name: itemTemplate.name,
                    price: itemTemplate.price,
                    weight: itemTemplate.weight
                });
            }
        }
        cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price, 0);
        cart.totalWeight = cart.items.reduce((sum, item) => sum + item.weight, 0);
        cart.remainingBudget = cart.budget - cart.totalPrice;
        cart.lastUpdated = new Date().toISOString();
        await (0, firebase_1.saveCartDoc)(cartId, cart);
        (0, socketService_1.emitCartUpdate)(cartId, cart);
        res.status(200).json({ success: true, cart });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.updateCartItemQuantity = updateCartItemQuantity;
// 10. POST /api/cart/resume
const resumeCartSession = async (req, res) => {
    try {
        const { cartId = 'CART_001' } = req.body;
        const cart = await fetchCartDoc(cartId);
        cart.status = 'shopping';
        cart.lastUpdated = new Date().toISOString();
        await (0, firebase_1.saveCartDoc)(cartId, cart);
        (0, socketService_1.emitCartUpdate)(cartId, cart);
        res.status(200).json({ success: true, cart });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.resumeCartSession = resumeCartSession;
// 11. POST /api/cart/batch-checkout
const batchCheckoutCart = async (req, res) => {
    try {
        const { deviceId = 'CART_001', physicalWeight, expectedWeight, items = [] } = req.body;
        const cartId = deviceId;
        const pWeight = Number(physicalWeight || 0);
        // Fetch cart document safely without throwing 500 on offline/network errors
        let cart = null;
        try {
            cart = await fetchCartDoc(cartId);
        }
        catch (cartErr) {
            console.warn('⚠️ Could not fetch cart doc from DB in batchCheckout:', cartErr);
        }
        // Determine expected weight: prefer explicit expectedWeight from payload, or calculate from items/cart
        let eWeight;
        if (expectedWeight !== undefined && expectedWeight !== null) {
            eWeight = Number(expectedWeight);
        }
        else if (Array.isArray(items) && items.length > 0) {
            const cartItems = [];
            for (const uid of items) {
                const template = exports.itemsDB[uid] || Object.values(exports.itemsDB).find(i => i.name === uid);
                if (template) {
                    cartItems.push({
                        uid,
                        name: template.name,
                        price: template.price,
                        weight: template.weight
                    });
                }
            }
            eWeight = cartItems.reduce((sum, item) => sum + item.weight, 0);
            if (cart) {
                cart.items = cartItems;
                cart.totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
                cart.totalWeight = eWeight;
            }
        }
        else if (cart) {
            eWeight = Number(cart.totalWeight || 0);
        }
        else {
            eWeight = 0;
        }
        // Weight difference tolerance check (<= 50g difference)
        const weightDifference = Math.abs(pWeight - eWeight);
        const weightMatch = weightDifference <= 50;
        const checkoutStatus = weightMatch ? 'approved' : 'mismatch';
        if (cart) {
            cart.physicalWeight = pWeight;
            cart.weightMatch = weightMatch;
            cart.checkout_status = checkoutStatus;
            cart.status = 'checkout';
            cart.lastUpdated = new Date().toISOString();
            try {
                await (0, firebase_1.saveCartDoc)(cartId, cart);
                (0, socketService_1.emitCartUpdate)(cartId, cart);
            }
            catch (err) {
                console.warn('⚠️ Failed to save cart doc:', err);
            }
        }
        // Sync Firebase Realtime Database status under kiosk_status/CART_001
        try {
            const statusPayload = {
                connected: true,
                wifiStatus: 'Connected',
                rssi: -50,
                last_active: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                currentShoppingSession: cartId,
                lastWeightReading: pWeight,
                physicalWeight: pWeight,
                expectedWeight: eWeight,
                lastRfidUid: Array.isArray(items) && items.length > 0 ? items[items.length - 1] : '',
                checkout_status: checkoutStatus,
                weightMatch,
                weightDifference,
                status: 'checkout',
                timestamp: Date.now()
            };
            if (firebase_1.adminRtdb) {
                await firebase_1.adminRtdb.ref(`kiosk_status/${cartId}`).update(statusPayload);
            }
            else if (firebase_1.rtdb) {
                await (0, database_1.set)((0, database_1.ref)(firebase_1.rtdb, `kiosk_status/${cartId}`), statusPayload);
            }
            try {
                const { esp32Service } = require('../services/esp32Service');
                await esp32Service.updateHeartbeat('Connected', -50, cartId, pWeight);
            }
            catch (e) { }
        }
        catch (rtdbErr) {
            console.error('⚠️ Failed to update RTDB in batchCheckout:', rtdbErr);
        }
        // Explicit responses required by ESP32 C++ hardware
        if (!weightMatch) {
            console.warn(`🚨 Batch checkout weight mismatch for ${cartId}: diff = ${weightDifference}g (Physical: ${pWeight}g, Expected: ${eWeight}g)`);
            return res.status(400).json({
                success: false,
                message: "Weight mismatch",
                approved: false,
                checkout_status: "mismatch",
                weightDifference,
                physicalWeight: pWeight,
                expectedWeight: eWeight
            });
        }
        console.log(`✅ Batch checkout approved for ${cartId}: Weight matched (Physical: ${pWeight}g, Expected: ${eWeight}g)`);
        return res.status(200).json({
            success: true,
            message: "Checkout approved",
            approved: true,
            checkout_status: "approved",
            weightDifference,
            physicalWeight: pWeight,
            expectedWeight: eWeight
        });
    }
    catch (error) {
        console.error('❌ Error in /api/cart/batch-checkout:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
exports.batchCheckoutCart = batchCheckoutCart;
