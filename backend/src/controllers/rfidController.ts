import { Request, Response } from 'express';
import { dbService } from '../services/dbService';
import { esp32Service } from '../services/esp32Service';
import { emitCartUpdate, emitNotification } from '../services/socketService';

export const scanRfidCard = async (req: Request, res: Response) => {
  try {
    const { uid, cartId = 'CART_001' } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'Missing RFID UID parameter.' });
    }

    console.log(`📡 RFID Scan Request Received. UID: ${uid}`);

    // Register scan on the ESP32 connection state
    esp32Service.registerScan(uid);

    // 1. Find or check Cart session status
    let cart = await dbService.getCart(cartId);
    if (!cart || cart.status !== 'active') {
      console.warn(`🚨 Rejected RFID Scan UID ${uid} because session status is ${cart ? cart.status : 'inactive'}`);
      emitNotification({
        type: 'warning',
        title: 'Scan Rejected',
        message: 'Kiosk session is not active. Please click Start Shopping on the kiosk.',
      });
      return res.status(400).json({ success: false, error: 'Shopping session is not active.' });
    }

    // 2. Search database Products collection
    const product = await dbService.getProductByRfid(uid);

    // 3. Log scan attempt in RFIDScan history collection
    await dbService.addRFIDScan({
      uid,
      timestamp: new Date(),
      success: !!product,
      productName: product ? product.productName : undefined,
    });

    // 4. Handle Product Not Found
    if (!product) {
      console.warn(`⚠️ RFID Tag ${uid} is unrecognized!`);
      emitNotification({
        type: 'error',
        title: 'Product Not Found',
        message: `Scanned unregistered tag UID: "${uid}"`,
      });
      return res.status(404).json({ success: false, error: 'Product Not Found' });
    }

    const productIdStr = product._id.toString();
    const itemIndex = cart.items.findIndex(
      (item: any) =>
        (typeof item.product === 'object' && item.product._id.toString() === productIdStr) ||
        (typeof item.product === 'string' && item.product === productIdStr)
    );

    // 5. Add product to items array and sync sensor weight
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += 1;
    } else {
      cart.items.push({ product: product._id, quantity: 1 } as any);
    }
    
    // Auto increment expected and physical weights during standard demo additions
    cart.expectedWeight += product.weight;
    cart.physicalWeight += product.weight;
    cart.totalAmount += product.price;

    const savedCart = await dbService.saveCart({
      cartId,
      items: cart.items,
      expectedWeight: cart.expectedWeight,
      physicalWeight: cart.physicalWeight,
      totalAmount: cart.totalAmount,
      weightMismatch: Math.abs(cart.expectedWeight - cart.physicalWeight) > 50,
    });

    // 6. Broadcast live updates and notifications
    emitCartUpdate(cartId, savedCart);
    emitNotification({
      type: 'success',
      title: 'RFID Scanned',
      message: `Added to cart: ${product.productName} (Rs. ${product.price})`,
    });

    // 7. Respond to hardware client (ESP32-S3)
    res.status(200).json({
      success: true,
      product: {
        name: product.productName,
        price: product.price,
        weight: product.weight,
        expiryDate: product.expiryDate,
      },
    });
  } catch (error: any) {
    console.error('RFID Scan endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getScanHistory = async (req: Request, res: Response) => {
  try {
    const history = await dbService.getRFIDScans();
    res.status(200).json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
