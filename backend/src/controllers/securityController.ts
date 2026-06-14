import { Request, Response } from 'express';
import { dbService } from '../services/dbService';
import { theftService } from '../services/theftService';
import { esp32Service } from '../services/esp32Service';

export const updatePhysicalWeight = async (req: Request, res: Response) => {
  try {
    const { cartId, physicalWeight } = req.body;

    if (!cartId || physicalWeight === undefined) {
      return res.status(400).json({ error: 'Missing cartId or physicalWeight.' });
    }

    // Register weight with the ESP32 connection service
    esp32Service.registerWeight(cartId, Number(physicalWeight));

    const updatedCart = await theftService.checkWeightDiscrepancy(cartId, Number(physicalWeight));
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
