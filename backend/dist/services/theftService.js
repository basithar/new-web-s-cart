"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.theftService = void 0;
const dbService_1 = require("./dbService");
const socketService_1 = require("./socketService");
const WEIGHT_THRESHOLD_GRAMS = 50; // allow ±50g tolerance (packaging variation)
exports.theftService = {
    checkWeightDiscrepancy: async (cartId, physicalWeight) => {
        // 1. Fetch active cart
        const cart = await dbService_1.dbService.getCart(cartId);
        if (!cart) {
            throw new Error(`Cart with ID ${cartId} not found.`);
        }
        // 2. Calculate expected weight
        let expectedWeight = 0;
        let totalAmount = 0;
        cart.items.forEach((item) => {
            const product = item.product;
            if (product && typeof product === 'object') {
                expectedWeight += product.weight * item.quantity;
                totalAmount += product.price * item.quantity;
            }
        });
        const diff = Math.abs(expectedWeight - physicalWeight);
        const hasMismatch = diff > WEIGHT_THRESHOLD_GRAMS;
        const previousMismatch = cart.weightMismatch;
        // 3. Update cart fields
        const updatedCart = await dbService_1.dbService.saveCart({
            cartId,
            expectedWeight,
            physicalWeight,
            totalAmount,
            weightMismatch: hasMismatch,
        });
        // 4. Handle Security Alerts & Logging
        if (hasMismatch && !previousMismatch) {
            console.warn(`🚨 Weight Mismatch flagged on cart ${cartId}!`);
            (0, socketService_1.emitNotification)({
                type: 'error',
                title: 'Weight Discrepancy Detected',
                message: `Cart reads: ${physicalWeight}g, expected: ${expectedWeight}g.`,
            });
        }
        else if (!hasMismatch && previousMismatch) {
            console.log(`✅ Cart ${cartId} weight discrepancy resolved.`);
            (0, socketService_1.emitNotification)({
                type: 'success',
                title: 'Weight Aligned',
                message: `Cart scale synchronized at ${physicalWeight}g.`,
            });
        }
        // 5. Broadcast updated cart state to frontend
        (0, socketService_1.emitCartUpdate)(cartId, updatedCart);
        return updatedCart;
    },
};
