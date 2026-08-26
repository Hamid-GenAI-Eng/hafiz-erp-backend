import { Request, Response } from 'express';
import { SettingsService } from '../services/SettingsService';

export class SettingsController {
  static async getSetting(req: Request, res: Response) {
    try {
      const setting = await SettingsService.getSetting(req.params.key as string);
      if (!setting) {
        return res.json({ key: req.params.key as string, value: null });
      }
      res.json(setting);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

  static async setSetting(req: Request, res: Response) {
    try {
      const { value, version } = req.body;
      if (value === undefined) {
        return res.status(400).json({ error: 'value is required' });
      }
      const updated = await SettingsService.setSetting(req.params.key as string, value, version);
      res.json(updated);
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('409')) {
        return res.status(409).json({ error: 'Conflict: Setting was modified by another device. Please refresh.' });
      }
      res.status(500).json({ error: err.message });
    }
  }
}
