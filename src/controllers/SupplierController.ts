import { Request, Response } from 'express';
import { SupplierService } from '../services/SupplierService';
import { randomUUID } from 'crypto';

export class SupplierController {

  static async getAllSuppliers(req: Request, res: Response) {
    try {
      const suppliers = await SupplierService.getAllSuppliers();
      res.json(suppliers);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

  static async getSupplierById(req: Request, res: Response) {
    try {
      const supplier = await SupplierService.getSupplierById(req.params.id as string);
      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }
      res.json(supplier);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

  static async createSupplier(req: Request, res: Response) {
    try {
      // Auto-generate UUID and Supplier Number
      const newId = randomUUID();
      const supplierNumber = `SUPP-${Math.floor(Math.random() * 100000)}`;

      const data = {
        id: newId,
        supplier_number: supplierNumber,
        company_name: req.body.company_name,
        contact_person: req.body.contact_person,
        phone: req.body.phone,
        email: req.body.email,
        address: req.body.address,
        category: req.body.category || 'Building',
        tax_id: req.body.tax_id,
        status: req.body.status || 'active',
        balance_owed: req.body.opening_balance || 0
      };

      const supplier = await SupplierService.createSupplier(data);
      res.status(201).json(supplier);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

  static async updateSupplier(req: Request, res: Response) {
    try {
      const incomingVersion = req.body.version;
      if (!incomingVersion) return res.status(400).json({ error: 'Version is required' });

      const supplier = await SupplierService.updateSupplier(req.params.id as string, req.body, incomingVersion);
      res.json(supplier);
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('409')) {
        return res.status(409).json({ error: 'Conflict: Supplier was modified by another device. Please refresh.' });
      }
      res.status(500).json({ error: err.message });
    }
  }

  static async deleteSupplier(req: Request, res: Response) {
    try {
      let version = req.body?.version;
      if (!version) {
         const existing = await SupplierService.getSupplierById(req.params.id as string);
         if (!existing) return res.status(404).json({ error: 'Supplier not found' });
         version = existing.version;
      }

      await SupplierService.deleteSupplier(req.params.id as string, version);
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

  // --- Ledgers ---

  static async getLedgerHistory(req: Request, res: Response) {
    try {
      const history = await SupplierService.getLedgerHistory(req.params.id as string);
      res.json(history);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

  static async createLedgerEntry(req: Request, res: Response) {
    try {
      const data = {
        id: randomUUID(),
        supplier_id: req.params.id as string,
        date: req.body.date,
        time: req.body.time,
        type: req.body.type,
        amount: req.body.amount || 0,
        payment_amount: req.body.payment_amount || 0,
        description: req.body.description,
        method: req.body.method,
        reference: req.body.reference
      };

      const entry = await SupplierService.createLedgerEntry(data);
      res.status(201).json(entry);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

  static async updateLedgerEntry(req: Request, res: Response) {
    try {
      const incomingVersion = req.body.version;
      if (!incomingVersion) return res.status(400).json({ error: 'Version is required for updates' });

      const entry = await SupplierService.updateLedgerEntry(req.params.ledgerId as string, incomingVersion, {
        amount: req.body.amount || 0,
        payment_amount: req.body.payment_amount || 0,
        description: req.body.description,
        date: req.body.date,
        time: req.body.time,
        method: req.body.method,
        reference: req.body.reference
      });

      res.json(entry);
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('409')) {
        return res.status(409).json({ error: 'Conflict: Ledger entry was modified by another device. Please refresh.' });
      }
      res.status(500).json({ error: err.message });
    }
  }

}
