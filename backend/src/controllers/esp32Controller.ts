import { Request, Response } from 'express';
import { esp32Service } from '../services/esp32Service';

export const postHeartbeat = async (req: Request, res: Response) => {
  try {
    const { wifiStatus = 'Connected', rssi = -60 } = req.body;
    
    // Register heartbeat
    esp32Service.updateHeartbeat(wifiStatus, Number(rssi));
    
    res.status(200).json({ success: true, message: 'Heartbeat registered.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const status = esp32Service.getStatus();
    res.status(200).json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
