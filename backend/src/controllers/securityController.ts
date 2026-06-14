import { Request, Response } from 'express';
import { dbService } from '../services/dbService';
import { theftService } from '../services/theftService';
import { esp32Service } from '../services/esp32Service';

export const updatePhysicalWeight = async (req: Request, res: Response) => {
  try {
    const { cartId, physicalWeight, weight } = req.body;
    const finalWeight = physicalWeight !== undefined ? Number(physicalWeight) : (weight !== undefined ? Number(weight) : undefined);

    if (!cartId || finalWeight === undefined) {
      return res.status(400).json({ error: 'Missing cartId or physicalWeight/weight.' });
    }

    // Register weight with the ESP32 connection service
    await esp32Service.registerWeight(cartId, finalWeight);

    const updatedCart = await theftService.checkWeightDiscrepancy(cartId, finalWeight);
    res.status(200).json(updatedCart);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSecurityLogs = async (req: Request, res: Response) => {
  try {
    res.status(200).json([]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
