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
        // 2. Map transaction items
        const purchaseItems = cart.items.map((item) => {
            const prod = item.product;
            return {
                productName: prod.productName,
                price: prod.price,
                quantity: item.quantity,
            };
        });
        const totalPaid = cart.totalAmount;
        const finalTxId = transactionId || `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`;
        const finalOrderNumber = orderNumber || `ORD-2026-${Math.floor(100 + Math.random() * 900)}`;
        const finalPaymentMethod = paymentMethod || 'Credit Card';
        const finalPaymentStatus = paymentStatus || 'Success';
        // 3. Create Transaction
        const transaction = await dbService_1.dbService.createTransaction({
            transactionId: finalTxId,
            orderNumber: finalOrderNumber,
            paymentMethod: finalPaymentMethod,
            customerName,
            phone,
            email,
            items: purchaseItems,
            totalPaid,
            paymentStatus: finalPaymentStatus,
        });
        // 4. Empty Cart
        const clearedCart = await dbService_1.dbService.saveCart({
            cartId,
            items: [],
            totalAmount: 0,
            expectedWeight: 0,
            physicalWeight: 0,
            weightMismatch: false,
            status: 'active',
        });
        // 5. Emit status update to clients
        (0, socketService_1.emitCartUpdate)(cartId, clearedCart);
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
