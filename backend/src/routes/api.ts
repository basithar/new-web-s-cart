import { Router } from 'express';
import { registerUser, loginUser, updateBudget, getUsers } from '../controllers/authController';
import { getProducts, createProduct, updateProduct, deleteProduct, bulkImportProducts } from '../controllers/productController';
import { getCart, updateItemQuantity, setCartBudget, startShoppingSession, stopShoppingSession, getAllCarts, resumeShoppingSession, removeItemFromCart } from '../controllers/cartController';
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
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.post('/products/bulk', bulkImportProducts);
router.delete('/products/:id', deleteProduct);

// --- Cart Routes ---
router.get('/cart/:cartId', getCart);
router.post('/cart/quantity', updateItemQuantity);
router.post('/cart/budget', setCartBudget);
router.post('/cart/weight-update', updatePhysicalWeight);
router.post('/cart/start', startShoppingSession);
router.post('/cart/stop', stopShoppingSession);
router.post('/cart/resume', resumeShoppingSession);
router.get('/shopping-sessions', getAllCarts);

// --- RFID Hardware / Scan Simulator Routes ---
router.post('/rfid/scan', scanRfidCard);
router.post('/cart/remove', removeItemFromCart);
router.get('/rfid/history', getScanHistory);

// --- ESP32 Telemetry Status Routes ---
router.post('/esp32/heartbeat', postHeartbeat);
router.get('/esp32/status', getStatus);

// --- Payment & Transaction Checkout Routes ---
router.post('/payment/process', processPayment);
router.post('/checkout', processPayment);
router.post('/weight/update', updatePhysicalWeight);
router.get('/transactions', getTransactions);

export default router;
