import { Request, Response } from 'express';
import { MiscService } from '../services/MiscService';

export class MiscController {
  static async getAllExpenses(req: Request, res: Response) {
    try {
      const data = await MiscService.getAllExpenses();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createExpense(req: Request, res: Response) {
    try {
      const data = await MiscService.createExpense(req.body);
      res.status(201).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateExpense(req: Request, res: Response) {
    try {
      if (!req.body.version) return res.status(400).json({ error: 'version is required' });
      const data = await MiscService.updateExpense(req.params.id as string, req.body, req.body.version);
      res.json(data);
    } catch (err: any) {
      if (err.message.includes('409')) return res.status(409).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  }

  static async deleteExpense(req: Request, res: Response) {
    try {
      const version = req.body?.version || (await MiscService.getExpenseById(req.params.id as string))?.version;
      if (!version) return res.status(404).json({ error: 'Expense not found' });
      await MiscService.deleteExpense(req.params.id as string, version);
      res.json({ success: true });
    } catch (err: any) {
      if (err.message.includes('409')) return res.status(409).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  }
}
