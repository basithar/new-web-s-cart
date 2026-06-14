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

    // Verify weight alignment
    const weightDifference = Math.abs(cart.expectedWeight - cart.physicalWeight);
    if (weightDifference > 25 || cart.weightMismatch) {
      return res.status(400).json({ error: 'Weight mismatch detected. Please scan or remove missing items.' });
    }

    // 2. Map transaction items & deduct catalog stock quantities
    const purchaseItems = [];
    for (const item of cart.items) {
      const prod = item.product as any;
      purchaseItems.push({
        productName: prod.name,
        price: prod.price,
        quantity: item.quantity,
      });

      // Deduct stock quantity
      await dbService.decrementProductStock(prod._id.toString(), item.quantity);
    }

    const totalPaid = cart.totalAmount;
    const totalWeight = cart.physicalWeight;
    const finalTxId = transactionId || `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`;
    const finalOrderNumber = orderNumber || `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalPaymentMethod = paymentMethod || 'Credit Card';
    const finalPaymentStatus = paymentStatus || 'Success';

    // 3. Create Transaction in Database
    const transaction = await dbService.createTransaction({
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

    // 4. Create historic Shopping Session Record
    await dbService.createShoppingSession({
      cartId,
      items: purchaseItems,
      budget: cart.budget,
      totalAmount: totalPaid,
      expectedWeight: cart.expectedWeight,
      physicalWeight: cart.physicalWeight,
    });

    // 5. Clear and reset active cart session
    const clearedCart = await dbService.saveCart({
      cartId,
      items: [],
      budget: 0,
      totalAmount: 0,
      expectedWeight: 0,
      physicalWeight: 0,
      weightMismatch: false,
      status: 'completed',
    });

    // 6. Emit status update to clients
    emitCartUpdate(cartId, clearedCart);
    emitNotification({
      type: 'success',
      title: 'Checkout Success',
      message: `Order ${finalTxId} processed successfully!`,
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
