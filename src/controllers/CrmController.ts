import { Request, Response } from 'express';
import { CrmService } from '../services/CrmService';
import { randomUUID } from 'crypto';

export class CrmController {

  static async getAllCustomers(req: Request, res: Response) {
    try {
      const customers = await CrmService.getAllCustomers();
      res.json(customers);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

  static async getCustomerById(req: Request, res: Response) {
    try {
      const customer = await CrmService.getCustomerById(req.params.id as string);
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      res.json(customer);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

  static async createCustomer(req: Request, res: Response) {
    try {
      // In a real app, customer_number should be generated atomically on the server
      const newId = randomUUID();
      const customerNumber = `CUST-${Math.floor(Math.random() * 100000)}`;

      const data = {
        id: newId,
        customer_number: customerNumber,
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
        status: req.body.status || 'active',
        balance: req.body.balance || 0
      };

      const customer = await CrmService.createCustomer(data);
      res.status(201).json(customer);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

  static async updateCustomer(req: Request, res: Response) {
    try {
      const incomingVersion = req.body.version;
      if (!incomingVersion) return res.status(400).json({ error: 'Version is required' });

      const customer = await CrmService.updateCustomer(req.params.id as string, req.body, incomingVersion);
      res.json(customer);
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('409')) {
        return res.status(409).json({ error: 'Conflict: Customer was modified by another device. Please refresh.' });
      }
      res.status(500).json({ error: err.message });
    }
  }

  static async deleteCustomer(req: Request, res: Response) {
    try {
      let version = req.body?.version;
      if (!version) {
         const existing = await CrmService.getCustomerById(req.params.id as string);
         if (!existing) return res.status(404).json({ error: 'Customer not found' });
         version = existing.version;
      }

      await CrmService.deleteCustomer(req.params.id as string, version);
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

  // --- Ledgers ---

  static async getLedgerHistory(req: Request, res: Response) {
    try {
      const history = await CrmService.getLedgerHistory(req.params.id as string);
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
        customer_id: req.params.id as string,
        date: req.body.date,
        time: req.body.time,
        type: req.body.type,
        amount: req.body.amount || 0,
        payment_amount: req.body.payment_amount || 0,
        description: req.body.description,
        method: req.body.method,
        reference: req.body.reference
      };

      const entry = await CrmService.createLedgerEntry(data);
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

      const entry = await CrmService.updateLedgerEntry(req.params.ledgerId as string, incomingVersion, {
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
