"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatus = exports.postHeartbeat = void 0;
const esp32Service_1 = require("../services/esp32Service");
const postHeartbeat = async (req, res) => {
    try {
        const { wifiStatus = 'Connected', rssi = -60, cartId, weight } = req.body;
        // Register heartbeat
        await esp32Service_1.esp32Service.updateHeartbeat(wifiStatus, Number(rssi), cartId, weight !== undefined ? Number(weight) : undefined);
        res.status(200).json({ success: true, message: 'Heartbeat registered.' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.postHeartbeat = postHeartbeat;
const getStatus = async (req, res) => {
    try {
        const status = await esp32Service_1.esp32Service.getStatus();
        res.status(200).json(status);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getStatus = getStatus;
