"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = exports.processPayment = void 0;
const dbService_1 = require("../services/dbService");
const socketService_1 = require("../services/socketService");
const processPayment = async (req, res) => {
    try {
        const { customerName, phone, email, cartId = 'CART_001', transactionId, orderNumber, paymentMethod, paymentStatus } = req.body;
        if (!customerName || !phone || !email) {
            return res.status(400).json({ error: 'Please complete all customer details.' });
        }
        // 1. Fetch Cart details
        const cart = await dbService_1.dbService.getCart(cartId);
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Active shopping cart is empty.' });
        }
        // Verify session state and weight alignment
        if (cart.status !== 'stopped') {
            return res.status(400).json({ error: 'Shopping session must be stopped and verified before payment.' });
        }
        if (cart.weightMismatch) {
            return res.status(400).json({ error: 'Weight mismatch detected. Please rescan or remove unscanned items.' });
        }
        // 2. Map transaction items & deduct catalog stock quantities
        const purchaseItems = [];
        for (const item of cart.items) {
            const prod = item.product;
            purchaseItems.push({
                productName: prod.name,
                price: prod.price,
                quantity: item.quantity,
            });
            // Deduct stock quantity
            await dbService_1.dbService.decrementProductStock(prod._id.toString(), item.quantity);
        }
        const totalPaid = cart.totalAmount;
        const totalWeight = cart.physicalWeight;
        const finalTxId = transactionId || `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`;
        const finalOrderNumber = orderNumber || `ORD-2026-${Math.floor(100 + Math.random() * 900)}`;
        const finalPaymentMethod = paymentMethod || 'Credit Card';
        const finalPaymentStatus = paymentStatus || 'Success';
        // 3. Create Transaction in Database
        const transaction = await dbService_1.dbService.createTransaction({
            transactionId: finalTxId,
            orderNumber: finalOrderNumber,
            paymentMethod: finalPaymentMethod,
            customerName,
            phone,
            email,
            items: purchaseItems,
            totalPaid,
            totalWeight,
            paymentStatus: finalPaymentStatus,
        });
        // 4. Mark Kiosk Session as Completed (rather than resetting immediately so it logs in session history)
        const completedCart = await dbService_1.dbService.saveCart({
            cartId,
            status: 'completed',
        });
        // 5. Emit status update to clients
        (0, socketService_1.emitCartUpdate)(cartId, completedCart);
        (0, socketService_1.emitNotification)({
            type: 'success',
            title: 'Checkout Success',
            message: `Order ${transactionId} processed successfully!`,
        });
        // 6. Return response
        res.status(200).json({
            success: true,
            transaction,
        });
    }
    catch (error) {
        console.error('Payment controller error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.processPayment = processPayment;
const getTransactions = async (req, res) => {
    try {
        const { email } = req.query;
        const txs = await dbService_1.dbService.getTransactions(email);
        res.status(200).json(txs);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getTransactions = getTransactions;
