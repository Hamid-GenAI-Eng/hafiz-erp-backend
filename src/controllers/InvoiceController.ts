import { Request, Response } from 'express';
import { InvoiceService } from '../services/InvoiceService';

export class InvoiceController {
  
  static async getAllInvoices(req: Request, res: Response) {
    try {
      const invoices = await InvoiceService.getAllInvoices();
      res.json(invoices);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getInvoiceById(req: Request, res: Response) {
    try {
      const invoice = await InvoiceService.getInvoiceById(req.params.id as string);
      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
      res.json(invoice);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createInvoice(req: Request, res: Response) {
    try {
      const invoice = await InvoiceService.createInvoice(req.body);
      res.status(201).json(invoice);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateInvoice(req: Request, res: Response) {
    try {
      const invoice = await InvoiceService.updateInvoice(req.params.id as string, req.body);
      res.json(invoice);
    } catch (err: any) {
      if (err.message && err.message.includes('Insufficient stock')) {
        res.status(400).json({ error: err.message });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  }

  static async deleteInvoice(req: Request, res: Response) {
    try {
      await InvoiceService.deleteInvoice(req.params.id as string);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

}
