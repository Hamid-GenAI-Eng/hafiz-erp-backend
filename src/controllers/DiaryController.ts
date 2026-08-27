import { Request, Response } from "express";
import { DiaryService } from "../services/DiaryService";

export class DiaryController {
  static async getAll(req: Request, res: Response) {
    try {
      const data = await DiaryService.getAll();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const data = await DiaryService.getById(req.params.id as string);
      res.json(data);
    } catch (error: any) {
      if (error.message.includes("not found")) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const id = await DiaryService.createEntry(req.body);
      res.status(201).json({ id, message: "Diary entry created successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = await DiaryService.updateEntry(req.params.id as string, req.body);
      res.json({ id, message: "Diary entry updated successfully" });
    } catch (error: any) {
      if (error.message.includes("Cannot edit")) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      await DiaryService.deleteEntry(req.params.id as string);
      res.json({ message: "Diary entry deleted successfully" });
    } catch (error: any) {
      if (error.message.includes("Cannot delete")) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  static async settleSingle(req: Request, res: Response) {
    try {
      await DiaryService.settleSingle(req.params.id as string);
      res.json({ message: "Diary entry settled successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async settleMultiple(req: Request, res: Response) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "ids must be an array" });
      }
      await DiaryService.settleMultiple(req.body);
      res.json({ message: "Diary entries settled successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async payPartial(req: Request, res: Response) {
    try {
      const id = await DiaryService.payPartial(req.body);
      res.json({ id, message: "Payment recorded successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async migrateToLedger(req: Request, res: Response) {
    try {
      const customerId = await DiaryService.migrateToLedger(req.body);
      res.json({ message: "Migrated to ledger successfully", customer_id: customerId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
