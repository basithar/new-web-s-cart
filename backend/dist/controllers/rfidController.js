"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScanHistory = exports.scanRfidCard = void 0;
const dbService_1 = require("../services/dbService");
const esp32Service_1 = require("../services/esp32Service");
const socketService_1 = require("../services/socketService");
const scanRfidCard = async (req, res) => {
    try {
        const { uid, cartId = 'CART_001' } = req.body;
        if (!uid) {
            return res.status(400).json({ error: 'Missing RFID UID parameter.' });
        }
        console.log(`📡 RFID Scan Request Received. UID: ${uid}`);
        // Register scan on the ESP32 connection state
        await esp32Service_1.esp32Service.registerScan(uid);
        // 1. Find or check Cart session status
        let cart = await dbService_1.dbService.getCart(cartId);
        if (!cart || cart.status !== 'active') {
            console.warn(`🚨 Rejected RFID Scan UID ${uid} because session status is ${cart ? cart.status : 'inactive'}`);
            (0, socketService_1.emitNotification)({
                type: 'warning',
                title: 'Scan Rejected',
                message: 'Kiosk session is not active. Please click Start Shopping on the kiosk.',
            });
            return res.status(400).json({ success: false, error: 'Shopping session is not active.' });
        }
        // 2. Search database Products collection
        const product = await dbService_1.dbService.getProductByRfid(uid);
        // 3. Log scan attempt in RFIDScan history collection
        await dbService_1.dbService.addRFIDScan({
            uid,
            timestamp: new Date(),
            success: !!product,
            productName: product ? product.name : undefined,
        });
        // 4. Handle Product Not Found
        if (!product) {
            console.warn(`⚠️ RFID Tag ${uid} is unrecognized!`);
            (0, socketService_1.emitNotification)({
                type: 'error',
                title: 'Product Not Found',
                message: `Scanned unregistered tag UID: "${uid}"`,
            });
            return res.status(404).json({ success: false, error: 'Product Not Found' });
        }
        const productIdStr = product._id.toString();
        const itemIndex = cart.items.findIndex((item) => (typeof item.product === 'object' && item.product._id.toString() === productIdStr) ||
            (typeof item.product === 'string' && item.product === productIdStr));
        // 5. Add product to items array and sync sensor weight
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += 1;
        }
        else {
            cart.items.push({ product: product._id, quantity: 1 });
        }
        // Auto increment expected and physical weights during standard demo additions
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
        // 6. Broadcast live updates and notifications
        (0, socketService_1.emitCartUpdate)(cartId, savedCart);
        (0, socketService_1.emitNotification)({
            type: 'success',
            title: 'RFID Scanned',
            message: `Added to cart: ${product.name} (Rs. ${product.price})`,
        });
        // 7. Respond to hardware client (ESP32-S3)
        res.status(200).json({
            success: true,
            product: {
                name: product.name,
                price: product.price,
                weight: product.weight,
            },
        });
    }
    catch (error) {
        console.error('RFID Scan endpoint error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.scanRfidCard = scanRfidCard;
const getScanHistory = async (req, res) => {
    try {
        const history = await dbService_1.dbService.getRFIDScans();
        res.status(200).json(history);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getScanHistory = getScanHistory;
