import { Request, Response } from "express";
import { NotesService } from "../services/NotesService";

export class NotesController {
  static async getAll(req: Request, res: Response) {
    try {
      const data = await NotesService.getAll();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const data = await NotesService.getById(req.params.id as string);
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
      const note = await NotesService.create(req.body);
      res.status(201).json({ note, message: "Note created successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      await NotesService.update(req.params.id as string, req.body);
      res.json({ message: "Note updated successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      await NotesService.remove(req.params.id as string);
      res.json({ message: "Note deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
