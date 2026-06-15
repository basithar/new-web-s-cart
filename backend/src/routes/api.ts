import { Router } from 'express';
import { 
  getCart, 
  scanRfidCard, 
  removeItemFromCart, 
  stopShoppingSession, 
  postHeartbeat, 
  payCart 
} from '../controllers/cartController';
import { postHeartbeatLegacy, testScanLegacy } from '../controllers/esp32Controller';

const router = Router();

// --- Main System Specification Routes ---
router.post('/rfid/scan', scanRfidCard);
router.post('/rfid/remove', removeItemFromCart);
router.post('/cart/stop', stopShoppingSession);
router.post('/esp32/heartbeat', postHeartbeat);
router.post('/cart/pay', payCart);
router.get('/cart/:cartId', getCart);

// --- Legacy Hardware Support Routes (From Step 10/11) ---
router.post('/heartbeat', postHeartbeatLegacy);
router.post('/test-scan', testScanLegacy);

export default router;
