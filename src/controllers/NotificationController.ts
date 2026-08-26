import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';

export class NotificationController {
  static async getNotifications(req: Request, res: Response) {
    try {
      const alerts = await NotificationService.getAlerts();
      res.json(alerts);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
}
