"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCarts = exports.resumeShoppingSession = exports.stopShoppingSession = exports.startShoppingSession = exports.setCartBudget = exports.updateItemQuantity = exports.getCart = void 0;
const dbService_1 = require("../services/dbService");
const socketService_1 = require("../services/socketService");
const getCart = async (req, res) => {
    try {
        const { cartId } = req.params;
        let cart = await dbService_1.dbService.getCart(cartId);
        if (!cart) {
            // Auto-create cart session if it doesn't exist yet
            cart = await dbService_1.dbService.saveCart({
                cartId,
                items: [],
                budget: 0,
                totalAmount: 0,
                expectedWeight: 0,
                physicalWeight: 0,
                weightMismatch: false,
                status: 'active',
            });
        }
        res.status(200).json({
            cart,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getCart = getCart;
const updateItemQuantity = async (req, res) => {
    try {
        const { cartId, productId, quantity } = req.body;
        if (!cartId || !productId) {
            return res.status(400).json({ error: 'Missing cartId or productId.' });
        }
        let cart = await dbService_1.dbService.getCart(cartId);
        if (!cart) {
            return res.status(404).json({ error: 'Cart session not found.' });
        }
        const itemIndex = cart.items.findIndex((item) => (typeof item.product === 'object' && item.product._id.toString() === productId) ||
            (typeof item.product === 'string' && item.product === productId));
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in cart.' });
        }
        if (quantity <= 0) {
            cart.items.splice(itemIndex, 1);
        }
        else {
            cart.items[itemIndex].quantity = quantity;
        }
        // Recalculate cost & weights
        let expectedWeight = 0;
        let totalAmount = 0;
        cart.items.forEach((item) => {
            // Re-populate item.product to make sure weight is accurate
            const prod = item.product;
            if (prod && typeof prod === 'object') {
                expectedWeight += prod.weight * item.quantity;
                totalAmount += prod.price * item.quantity;
            }
        });
        const isMismatch = Math.abs(expectedWeight - cart.physicalWeight) > 50;
        const updatedCart = await dbService_1.dbService.saveCart({
            cartId,
            items: cart.items,
            expectedWeight,
            totalAmount,
            weightMismatch: isMismatch,
        });
        (0, socketService_1.emitCartUpdate)(cartId, updatedCart);
        res.status(200).json(updatedCart);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateItemQuantity = updateItemQuantity;
const setCartBudget = async (req, res) => {
    try {
        const { cartId, budget } = req.body;
        if (!cartId || budget === undefined) {
            return res.status(400).json({ error: 'Missing cartId or budget.' });
        }
        const cart = await dbService_1.dbService.getCart(cartId);
        if (!cart) {
            return res.status(404).json({ error: 'Cart session not found.' });
        }
        const updatedCart = await dbService_1.dbService.saveCart({
            cartId,
            budget: Number(budget),
        });
        (0, socketService_1.emitCartUpdate)(cartId, updatedCart);
        res.status(200).json(updatedCart);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.setCartBudget = setCartBudget;
const startShoppingSession = async (req, res) => {
    try {
        const { cartId = 'CART_001' } = req.body;
        // Reset and initialize cart session to active
        const cart = await dbService_1.dbService.saveCart({
            cartId,
            items: [],
            budget: 0,
            totalAmount: 0,
            expectedWeight: 0,
            physicalWeight: 0,
            weightMismatch: false,
            status: 'active',
        });
        (0, socketService_1.emitCartUpdate)(cartId, cart);
        (0, socketService_1.emitNotification)({
            type: 'info',
            title: 'Session Started',
            message: 'Kiosk shopping session started. RFID tag scanning is enabled.',
        });
        res.status(200).json({ success: true, cart });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.startShoppingSession = startShoppingSession;
const stopShoppingSession = async (req, res) => {
    try {
        const { cartId = 'CART_001', physicalWeight } = req.body;
        if (physicalWeight === undefined) {
            return res.status(400).json({ error: 'Missing physicalWeight for verification.' });
        }
        const cart = await dbService_1.dbService.getCart(cartId);
        if (!cart) {
            return res.status(404).json({ error: 'Cart session not found.' });
        }
        // 1. Calculate total expected weight of all scanned products from database
        let expectedWeight = 0;
        let totalAmount = 0;
        for (const item of cart.items) {
            const prodId = item.product._id?.toString() || item.product.toString();
            const product = await dbService_1.dbService.getProductById(prodId);
            if (product) {
                expectedWeight += product.weight * item.quantity;
                totalAmount += product.price * item.quantity;
            }
        }
        const weightDifference = Math.abs(expectedWeight - Number(physicalWeight));
        const weightMismatch = weightDifference > 50; // allow ±50g tolerance
        // 2. Save session status stopped and save final verified weights
        const updatedCart = await dbService_1.dbService.saveCart({
            cartId,
            expectedWeight,
            physicalWeight: Number(physicalWeight),
            totalAmount,
            weightMismatch,
            status: 'stopped',
        });
        (0, socketService_1.emitCartUpdate)(cartId, updatedCart);
        if (weightMismatch) {
            (0, socketService_1.emitNotification)({
                type: 'error',
                title: 'Weight Mismatch Flagged',
                message: `Mismatch detected! Kiosk reads ${physicalWeight}g, but database expected ${expectedWeight}g. Please rescan or remove unscanned items.`,
            });
        }
        else {
            (0, socketService_1.emitNotification)({
                type: 'success',
                title: 'Weight Verified',
                message: `Cart weight verified successfully at ${physicalWeight}g.`,
            });
        }
        res.status(200).json({ success: true, cart: updatedCart });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.stopShoppingSession = stopShoppingSession;
const resumeShoppingSession = async (req, res) => {
    try {
        const { cartId = 'CART_001' } = req.body;
        const cart = await dbService_1.dbService.getCart(cartId);
        if (!cart) {
            return res.status(404).json({ error: 'Cart session not found.' });
        }
        const updatedCart = await dbService_1.dbService.saveCart({
            cartId,
            status: 'active',
        });
        (0, socketService_1.emitCartUpdate)(cartId, updatedCart);
        (0, socketService_1.emitNotification)({
            type: 'info',
            title: 'Session Resumed',
            message: 'Kiosk shopping session resumed. RFID scanning is enabled.',
        });
        res.status(200).json({ success: true, cart: updatedCart });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.resumeShoppingSession = resumeShoppingSession;
const getAllCarts = async (req, res) => {
    try {
        const carts = await dbService_1.dbService.getCarts();
        res.status(200).json(carts);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAllCarts = getAllCarts;
