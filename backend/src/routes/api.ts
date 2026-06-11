import { Router } from 'express';
import { registerUser, loginUser, updateBudget, getUsers } from '../controllers/authController';
import { getProducts, createOrUpdateProduct, deleteProduct, bulkImportProducts } from '../controllers/productController';
import { getCart, updateItemQuantity, setCartBudget } from '../controllers/cartController';
import { scanRfidCard, getScanHistory } from '../controllers/rfidController';
import { postHeartbeat, getStatus } from '../controllers/esp32Controller';
import { updatePhysicalWeight } from '../controllers/securityController';
import { processPayment, getTransactions } from '../controllers/paymentController';

const router = Router();

// --- Auth Routes ---
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.post('/auth/budget', updateBudget);
router.get('/users', getUsers);

// --- Product/Inventory Catalog Routes ---
router.get('/products', getProducts);
router.post('/products', createOrUpdateProduct);
router.post('/products/bulk', bulkImportProducts);
router.delete('/products/:id', deleteProduct);

// --- Cart Routes ---
router.get('/cart/:cartId', getCart);
router.post('/cart/quantity', updateItemQuantity);
router.post('/cart/budget', setCartBudget);
router.post('/cart/weight-update', updatePhysicalWeight);

// --- RFID Hardware / Scan Simulator Routes ---
router.post('/rfid/scan', scanRfidCard);
router.get('/rfid/history', getScanHistory);

// --- ESP32 Telemetry Status Routes ---
router.post('/esp32/heartbeat', postHeartbeat);
router.get('/esp32/status', getStatus);

// --- Payment & Transaction Checkout Routes ---
router.post('/payment/process', processPayment);
router.get('/transactions', getTransactions);

export default router;
