"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cartController_1 = require("../controllers/cartController");
const esp32Controller_1 = require("../controllers/esp32Controller");
const router = (0, express_1.Router)();
// --- Main System Specification Routes ---
router.post('/rfid/scan', cartController_1.scanRfidCard);
router.post('/rfid/remove', cartController_1.removeItemFromCart);
router.post('/cart/stop', cartController_1.stopShoppingSession);
router.post('/esp32/heartbeat', cartController_1.postHeartbeat);
router.post('/cart/pay', cartController_1.payCart);
router.get('/cart/:cartId', cartController_1.getCart);
// --- Legacy Hardware Support Routes (From Step 10/11) ---
router.post('/heartbeat', esp32Controller_1.postHeartbeatLegacy);
router.post('/test-scan', esp32Controller_1.testScanLegacy);
exports.default = router;
