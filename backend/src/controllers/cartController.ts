import { Request, Response } from 'express';
import { dbService } from '../services/dbService';
import { emitCartUpdate, emitNotification, emitCheckoutStatus } from '../services/socketService';

export const getCart = async (req: Request, res: Response) => {
  try {
    const { cartId } = req.params;
    let cart = await dbService.getCart(cartId);

    if (!cart) {
      // Auto-create cart session if it doesn't exist yet
      cart = await dbService.saveCart({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateItemQuantity = async (req: Request, res: Response) => {
  try {
    const { cartId, productId, quantity } = req.body;

    if (!cartId || !productId) {
      return res.status(400).json({ error: 'Missing cartId or productId.' });
    }

    let cart = await dbService.getCart(cartId);
    if (!cart) {
      return res.status(404).json({ error: 'Cart session not found.' });
    }

    const itemIndex = cart.items.findIndex(
      (item: any) =>
        (typeof item.product === 'object' && item.product._id.toString() === productId) ||
        (typeof item.product === 'string' && item.product === productId)
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart.' });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    // Recalculate cost & weights
    let expectedWeight = 0;
    let totalAmount = 0;

    cart.items.forEach((item: any) => {
      // Re-populate item.product to make sure weight is accurate
      const prod = item.product;
      if (prod && typeof prod === 'object') {
        expectedWeight += prod.weight * item.quantity;
        totalAmount += prod.price * item.quantity;
      }
    });

    const isMismatch = Math.abs(expectedWeight - cart.physicalWeight) > 25;

    const updatedCart = await dbService.saveCart({
      cartId,
      items: cart.items,
      expectedWeight,
      totalAmount,
      weightMismatch: isMismatch,
    });

    emitCartUpdate(cartId, updatedCart);

    res.status(200).json(updatedCart);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const setCartBudget = async (req: Request, res: Response) => {
  try {
    const { cartId, budget } = req.body;

    if (!cartId || budget === undefined) {
      return res.status(400).json({ error: 'Missing cartId or budget.' });
    }

    const cart = await dbService.getCart(cartId);
    if (!cart) {
      return res.status(404).json({ error: 'Cart session not found.' });
    }

    const updatedCart = await dbService.saveCart({
      cartId,
      budget: Number(budget),
    });

    emitCartUpdate(cartId, updatedCart);

    res.status(200).json(updatedCart);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const startShoppingSession = async (req: Request, res: Response) => {
  try {
    const { cartId = 'CART_001' } = req.body;

    // Reset and initialize cart session to active
    const cart = await dbService.saveCart({
      cartId,
      items: [],
      budget: 0,
      totalAmount: 0,
      expectedWeight: 0,
      physicalWeight: 0,
      weightMismatch: false,
      status: 'active',
    });

    emitCartUpdate(cartId, cart);
    
    emitNotification({
      type: 'info',
      title: 'Session Started',
      message: 'Kiosk shopping session started. RFID tag scanning is enabled.',
    });

    res.status(200).json({ success: true, cart });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const stopShoppingSession = async (req: Request, res: Response) => {
  try {
    const { cartId = 'CART_001', physicalWeight } = req.body;

    if (physicalWeight === undefined) {
      return res.status(400).json({ error: 'Missing physicalWeight for verification.' });
    }

    const cart = await dbService.getCart(cartId);
    if (!cart) {
      return res.status(404).json({ error: 'Cart session not found.' });
    }

    // 1. Calculate total expected weight of all scanned products from database
    let expectedWeight = 0;
    let totalAmount = 0;

    for (const item of cart.items) {
      const prodId = (item.product as any)._id?.toString() || (item.product as any).toString();
      const product = await dbService.getProductById(prodId);
      if (product) {
        expectedWeight += product.weight * item.quantity;
        totalAmount += product.price * item.quantity;
      }
    }

    const weightDifference = Math.abs(expectedWeight - Number(physicalWeight));
    const isValid = weightDifference <= 25; // allow ±25g tolerance
    const statusStr = isValid ? 'ready_for_payment' : 'weight_mismatch';

    // 2. Save session status and save final verified weights
    const updatedCart = await dbService.saveCart({
      cartId,
      expectedWeight,
      physicalWeight: Number(physicalWeight),
      totalAmount,
      weightMismatch: !isValid,
      status: statusStr,
    });

    emitCartUpdate(cartId, updatedCart);
    emitCheckoutStatus(cartId, { success: isValid, status: statusStr });

    if (!isValid) {
      emitNotification({
        type: 'error',
        title: 'Weight Mismatch Flagged',
        message: `Mismatch detected! Kiosk reads ${physicalWeight}g, but database expected ${expectedWeight}g. Please rescan or remove unscanned items.`,
      });
      return res.status(200).json({ success: false, status: 'weight_mismatch' });
    } else {
      emitNotification({
        type: 'success',
        title: 'Weight Verified',
        message: `Cart weight verified successfully at ${physicalWeight}g.`,
      });
      return res.status(200).json({ success: true, status: 'ready_for_payment' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const resumeShoppingSession = async (req: Request, res: Response) => {
  try {
    const { cartId = 'CART_001' } = req.body;

    const cart = await dbService.getCart(cartId);
    if (!cart) {
      return res.status(404).json({ error: 'Cart session not found.' });
    }

    const updatedCart = await dbService.saveCart({
      cartId,
      status: 'active',
    });

    emitCartUpdate(cartId, updatedCart);
    emitNotification({
      type: 'info',
      title: 'Session Resumed',
      message: 'Kiosk shopping session resumed. RFID scanning is enabled.',
    });

    res.status(200).json({ success: true, cart: updatedCart });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllCarts = async (req: Request, res: Response) => {
  try {
    const carts = await dbService.getCarts();
    res.status(200).json(carts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const removeItemFromCart = async (req: Request, res: Response) => {
  try {
    const { uid, cartId = 'CART_001' } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'Missing RFID UID parameter.' });
    }

    let cart = await dbService.getCart(cartId);
    if (!cart) {
      return res.status(404).json({ error: 'Cart session not found.' });
    }

    const product = await dbService.getProductByRfid(uid);
    if (!product) {
      return res.status(404).json({ error: 'Product not registered in database catalog.' });
    }

    const productIdStr = product._id.toString();
    const itemIndex = cart.items.findIndex(
      (item: any) =>
        (typeof item.product === 'object' && item.product._id.toString() === productIdStr) ||
        (typeof item.product === 'string' && item.product === productIdStr)
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in shopping cart.' });
    }

    if (cart.items[itemIndex].quantity > 1) {
      cart.items[itemIndex].quantity -= 1;
    } else {
      cart.items.splice(itemIndex, 1);
    }

    cart.expectedWeight = Math.max(0, cart.expectedWeight - product.weight);
    cart.physicalWeight = Math.max(0, cart.physicalWeight - product.weight);
    cart.totalAmount = Math.max(0, cart.totalAmount - product.price);

    const savedCart = await dbService.saveCart({
      cartId,
      items: cart.items,
      expectedWeight: cart.expectedWeight,
      physicalWeight: cart.physicalWeight,
      totalAmount: cart.totalAmount,
      weightMismatch: Math.abs(cart.expectedWeight - cart.physicalWeight) > 25,
    });

    emitCartUpdate(cartId, savedCart);
    emitNotification({
      type: 'warning',
      title: 'Item Removed',
      message: `Removed from cart: ${product.name}`,
    });

    res.status(200).json({ success: true, cart: savedCart });
  } catch (error: any) {
    console.error('Remove item endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
};
