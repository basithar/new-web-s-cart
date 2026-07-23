"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cartController_1 = require("../controllers/cartController");
const esp32Controller_1 = require("../controllers/esp32Controller");
const rfidController_1 = require("../controllers/rfidController");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
// --- Main System Specification Routes ---
router.post('/rfid/scan', cartController_1.scanRfidCard);
router.post('/rfid/remove', cartController_1.removeItemFromCart);
router.post('/cart/stop', cartController_1.stopShoppingSession);
router.post('/esp32/heartbeat', cartController_1.postHeartbeat);
router.post('/cart/pay', cartController_1.payCart);
router.get('/cart/:cartId', cartController_1.getCart);
// --- Hardware Product Scan Endpoint ---
router.get('/product/:uid', cartController_1.getProductByUid);
router.get('/rfid/:uid', cartController_1.getProductByUid);
// --- Extra API Routes ---
router.get('/rfid/history', rfidController_1.getScanHistory);
router.post('/payment/process', paymentController_1.processPayment);
router.post('/cart/start', cartController_1.startCart);
router.post('/cart/budget', cartController_1.updateCartBudget);
router.post('/cart/quantity', cartController_1.updateCartItemQuantity);
router.post('/cart/resume', cartController_1.resumeCartSession);
router.post('/cart/batch-checkout', cartController_1.batchCheckoutCart);
// --- Legacy Hardware Support Routes (From Step 10/11) ---
router.post('/heartbeat', esp32Controller_1.postHeartbeatLegacy);
router.post('/test-scan', esp32Controller_1.testScanLegacy);
exports.default = router;
