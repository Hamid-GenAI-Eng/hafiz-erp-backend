import { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';

export class DashboardController {
  static async getDashboardData(req: Request, res: Response) {
    try {
      const range = (req.query.range as string) || 'daily';
      const data = await DashboardService.getDashboardData(range);
      res.json(data);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
}
