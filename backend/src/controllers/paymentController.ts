import { Request, Response } from 'express';
import { dbService } from '../services/dbService';
import { emitCartUpdate, emitNotification } from '../services/socketService';

export const processPayment = async (req: Request, res: Response) => {
  try {
    const { 
      customerName, 
      phone, 
      email, 
      cartId = 'CART_001',
      transactionId,
      orderNumber,
      paymentMethod,
      paymentStatus
    } = req.body;

    if (!customerName || !phone || !email) {
      return res.status(400).json({ error: 'Please complete all customer details.' });
    }

    // 1. Fetch Cart details
    const cart = await dbService.getCart(cartId);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Active shopping cart is empty.' });
    }

    // 2. Map transaction items
    const purchaseItems = cart.items.map((item: any) => {
      const prod = item.product as any;
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
    const transaction = await dbService.createTransaction({
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
    const clearedCart = await dbService.saveCart({
      cartId,
      items: [],
      totalAmount: 0,
      expectedWeight: 0,
      physicalWeight: 0,
      weightMismatch: false,
      status: 'active',
    });

    // 5. Emit status update to clients
    emitCartUpdate(cartId, clearedCart);
    emitNotification({
      type: 'success',
      title: 'Checkout Success',
      message: `Order ${transactionId} processed successfully!`,
    });

    // 6. Return response
    res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error: any) {
    console.error('Payment controller error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    const txs = await dbService.getTransactions(email as string);
    res.status(200).json(txs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
