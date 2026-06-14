"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const productController_1 = require("../controllers/productController");
const cartController_1 = require("../controllers/cartController");
const rfidController_1 = require("../controllers/rfidController");
const esp32Controller_1 = require("../controllers/esp32Controller");
const securityController_1 = require("../controllers/securityController");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
// --- Auth Routes ---
router.post('/auth/register', authController_1.registerUser);
router.post('/auth/login', authController_1.loginUser);
router.post('/auth/budget', authController_1.updateBudget);
router.get('/users', authController_1.getUsers);
// --- Product/Inventory Catalog Routes ---
router.get('/products', productController_1.getProducts);
router.post('/products', productController_1.createProduct);
router.put('/products/:id', productController_1.updateProduct);
router.post('/products/bulk', productController_1.bulkImportProducts);
router.delete('/products/:id', productController_1.deleteProduct);
// --- Cart Routes ---
router.get('/cart/:cartId', cartController_1.getCart);
router.post('/cart/quantity', cartController_1.updateItemQuantity);
router.post('/cart/budget', cartController_1.setCartBudget);
router.post('/cart/weight-update', securityController_1.updatePhysicalWeight);
router.post('/cart/start', cartController_1.startShoppingSession);
router.post('/cart/stop', cartController_1.stopShoppingSession);
router.post('/cart/resume', cartController_1.resumeShoppingSession);
router.get('/shopping-sessions', cartController_1.getAllCarts);
// --- RFID Hardware / Scan Simulator Routes ---
router.post('/rfid/scan', rfidController_1.scanRfidCard);
router.get('/rfid/history', rfidController_1.getScanHistory);
// --- ESP32 Telemetry Status Routes ---
router.post('/esp32/heartbeat', esp32Controller_1.postHeartbeat);
router.get('/esp32/status', esp32Controller_1.getStatus);
// --- Payment & Transaction Checkout Routes ---
router.post('/payment/process', paymentController_1.processPayment);
router.get('/transactions', paymentController_1.getTransactions);
exports.default = router;
