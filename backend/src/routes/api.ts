import { Router } from 'express';
import { 
  getCart, 
  scanRfidCard, 
  removeItemFromCart, 
  stopShoppingSession, 
  postHeartbeat, 
  payCart,
  startCart,
  updateCartBudget,
  updateCartItemQuantity,
  resumeCartSession
} from '../controllers/cartController';
import { postHeartbeatLegacy, testScanLegacy } from '../controllers/esp32Controller';
import { getScanHistory } from '../controllers/rfidController';
import { processPayment } from '../controllers/paymentController';

const router = Router();

// --- Main System Specification Routes ---
router.post('/rfid/scan', scanRfidCard);
router.post('/rfid/remove', removeItemFromCart);
router.post('/cart/stop', stopShoppingSession);
router.post('/esp32/heartbeat', postHeartbeat);
router.post('/cart/pay', payCart);
router.get('/cart/:cartId', getCart);

// --- Extra API Routes ---
router.get('/rfid/history', getScanHistory);
router.post('/payment/process', processPayment);
router.post('/cart/start', startCart);
router.post('/cart/budget', updateCartBudget);
router.post('/cart/quantity', updateCartItemQuantity);
router.post('/cart/resume', resumeCartSession);

// --- Legacy Hardware Support Routes (From Step 10/11) ---
router.post('/heartbeat', postHeartbeatLegacy);
router.post('/test-scan', testScanLegacy);

export default router;
