"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payCart = exports.postHeartbeat = exports.stopShoppingSession = exports.removeItemFromCart = exports.scanRfidCard = exports.getCart = exports.itemsDB = void 0;
const firebase_1 = require("../config/firebase");
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
        const cart = await fetchCartDoc(cartId);
        // Add item to items array
        cart.items.push({
            uid,
            name: itemTemplate.name,
            price: itemTemplate.price,
            weight: itemTemplate.weight
        });
        // Recompute aggregates
        cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price, 0);
        cart.totalWeight = cart.items.reduce((sum, item) => sum + item.weight, 0);
        cart.remainingBudget = cart.budget - cart.totalPrice;
        cart.status = 'shopping';
        cart.physicalWeight = Number(weight);
        cart.lastUpdated = new Date().toISOString();
        await (0, firebase_1.saveCartDoc)(cartId, cart);
        res.status(200).json({
            success: true,
            item: {
                name: itemTemplate.name,
                price: itemTemplate.price,
                weight: itemTemplate.weight
            },
            cart: {
                totalPrice: cart.totalPrice,
                totalWeight: cart.totalWeight,
                remainingBudget: cart.remainingBudget
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
        const cart = await fetchCartDoc(cartId);
        // Find index of item in cart array
        const itemIndex = cart.items.findIndex(item => item.uid === uid);
        if (itemIndex > -1) {
            cart.items.splice(itemIndex, 1);
        }
        // Recompute aggregates
        cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price, 0);
        cart.totalWeight = cart.items.reduce((sum, item) => sum + item.weight, 0);
        cart.remainingBudget = cart.budget - cart.totalPrice;
        cart.physicalWeight = Number(weight);
        cart.lastUpdated = new Date().toISOString();
        await (0, firebase_1.saveCartDoc)(cartId, cart);
        res.status(200).json({
            success: true,
            cart: {
                totalPrice: cart.totalPrice,
                totalWeight: cart.totalWeight
            }
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
        const { cartId = 'CART_001', weight = 0, budget = 3500 } = req.body;
        const cart = await fetchCartDoc(cartId);
        cart.physicalWeight = Number(weight);
        cart.budget = Number(budget);
        cart.remainingBudget = cart.budget - cart.totalPrice;
        cart.lastSeen = new Date().toISOString();
        cart.lastUpdated = new Date().toISOString();
        await (0, firebase_1.saveCartDoc)(cartId, cart);
        res.status(200).json({ success: true });
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
        res.status(200).json({ success: true, message: "Payment successful" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.payCart = payCart;
