import { dbService } from './dbService';
import { emitCartUpdate, emitNotification } from './socketService';

const WEIGHT_THRESHOLD_GRAMS = 50; // allow ±50g tolerance (packaging variation)

export const theftService = {
  checkWeightDiscrepancy: async (cartId: string, physicalWeight: number): Promise<any> => {
    // 1. Fetch active cart
    const cart = await dbService.getCart(cartId);
    if (!cart) {
      throw new Error(`Cart with ID ${cartId} not found.`);
    }

    // 2. Calculate expected weight
    let expectedWeight = 0;
    let totalAmount = 0;

    cart.items.forEach((item: any) => {
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
    const updatedCart = await dbService.saveCart({
      cartId,
      expectedWeight,
      physicalWeight,
      totalAmount,
      weightMismatch: hasMismatch,
    });

    // 4. Handle Security Alerts & Logging
    if (hasMismatch && !previousMismatch) {
      console.warn(`🚨 Weight Mismatch flagged on cart ${cartId}!`);
      emitNotification({
        type: 'error',
        title: 'Weight Discrepancy Detected',
        message: `Cart reads: ${physicalWeight}g, expected: ${expectedWeight}g.`,
      });
    } else if (!hasMismatch && previousMismatch) {
      console.log(`✅ Cart ${cartId} weight discrepancy resolved.`);
      emitNotification({
        type: 'success',
        title: 'Weight Aligned',
        message: `Cart scale synchronized at ${physicalWeight}g.`,
      });
    }

    // 5. Broadcast updated cart state to frontend
    emitCartUpdate(cartId, updatedCart);

    return updatedCart;
  },
};
