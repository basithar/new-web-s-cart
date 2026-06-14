"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecurityLogs = exports.updatePhysicalWeight = void 0;
const theftService_1 = require("../services/theftService");
const esp32Service_1 = require("../services/esp32Service");
const updatePhysicalWeight = async (req, res) => {
    try {
        const { cartId, physicalWeight, weight } = req.body;
        const finalWeight = physicalWeight !== undefined ? Number(physicalWeight) : (weight !== undefined ? Number(weight) : undefined);
        if (!cartId || finalWeight === undefined) {
            return res.status(400).json({ error: 'Missing cartId or physicalWeight/weight.' });
        }
        // Register weight with the ESP32 connection service
        await esp32Service_1.esp32Service.registerWeight(cartId, finalWeight);
        const updatedCart = await theftService_1.theftService.checkWeightDiscrepancy(cartId, finalWeight);
        res.status(200).json(updatedCart);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updatePhysicalWeight = updatePhysicalWeight;
const getSecurityLogs = async (req, res) => {
    try {
        res.status(200).json([]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getSecurityLogs = getSecurityLogs;
