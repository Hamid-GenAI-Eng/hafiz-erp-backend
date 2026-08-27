import { Request, Response } from 'express';
import { LogisticsService } from '../services/LogisticsService';

export class LogisticsController {
  // ----------------------------------------------------
  // VEHICLES
  // ----------------------------------------------------
  static async getAllVehicles(req: Request, res: Response) {
    try {
      const data = await LogisticsService.getAllVehicles();
      res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  }

  static async createVehicle(req: Request, res: Response) {
    try {
      const data = await LogisticsService.createVehicle(req.body);
      res.status(201).json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  }

  static async updateVehicle(req: Request, res: Response) {
    try {
      if (!req.body.version) return res.status(400).json({ error: 'version is required' });
      const data = await LogisticsService.updateVehicle(req.params.id as string, req.body, req.body.version);
      res.json(data);
    } catch (err: any) {
      if (err.message.includes('409')) return res.status(409).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  }

  static async deleteVehicle(req: Request, res: Response) {
    try {
      const version = req.body?.version || (await LogisticsService.getVehicleById(req.params.id as string))?.version;
      if (!version) return res.status(404).json({ error: 'Vehicle not found' });
      await LogisticsService.deleteVehicle(req.params.id as string, version);
      res.json({ success: true });
    } catch (err: any) {
      if (err.message.includes('409')) return res.status(409).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  }

  // ----------------------------------------------------
  // EMPLOYEES
  // ----------------------------------------------------
  static async getAllEmployees(req: Request, res: Response) {
    try {
      const data = await LogisticsService.getAllEmployees();
      res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  }

  static async createEmployee(req: Request, res: Response) {
    try {
      const data = await LogisticsService.createEmployee(req.body);
      res.status(201).json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  }

  static async updateEmployee(req: Request, res: Response) {
    try {
      if (!req.body.version) return res.status(400).json({ error: 'version is required' });
      const data = await LogisticsService.updateEmployee(req.params.id as string, req.body, req.body.version);
      res.json(data);
    } catch (err: any) {
      if (err.message.includes('409')) return res.status(409).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  }

  static async deleteEmployee(req: Request, res: Response) {
    try {
      const version = req.body?.version || (await LogisticsService.getEmployeeById(req.params.id as string))?.version;
      if (!version) return res.status(404).json({ error: 'Employee not found' });
      await LogisticsService.deleteEmployee(req.params.id as string, version);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // ----------------------------------------------------
  // EXPENSES
  // ----------------------------------------------------
  static async getAllExpenses(req: Request, res: Response) {
    try {
      const data = await LogisticsService.getAllExpenses();
      res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  }

  static async createExpense(req: Request, res: Response) {
    try {
      const data = await LogisticsService.createExpense(req.body);
      res.status(201).json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  }

  static async updateExpense(req: Request, res: Response) {
    try {
      if (!req.body.version) return res.status(400).json({ error: 'version is required' });
      const data = await LogisticsService.updateExpense(req.params.id as string, req.body, req.body.version);
      res.json(data);
    } catch (err: any) {
      if (err.message.includes('409')) return res.status(409).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  }

  static async deleteExpense(req: Request, res: Response) {
    try {
      const version = req.body?.version || (await LogisticsService.getExpenseById(req.params.id as string))?.version;
      if (!version) return res.status(404).json({ error: 'Expense not found' });
      await LogisticsService.deleteExpense(req.params.id as string, version);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  }

  // ----------------------------------------------------
  // BUCKET RENTALS
  // ----------------------------------------------------
  static async getAllBucketRentals(req: Request, res: Response) {
    try {
      const data = await LogisticsService.getAllBucketRentals();
      res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  }

  static async createBucketRental(req: Request, res: Response) {
    try {
      const data = await LogisticsService.createBucketRental(req.body);
      res.status(201).json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  }

  static async updateBucketRental(req: Request, res: Response) {
    try {
      if (!req.body.version) return res.status(400).json({ error: 'version is required' });
      const data = await LogisticsService.updateBucketRental(req.params.id as string, req.body, req.body.version);
      res.json(data);
    } catch (err: any) {
      if (err.message.includes('409')) return res.status(409).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  }

  static async deleteBucketRental(req: Request, res: Response) {
    try {
      const version = req.body?.version || (await LogisticsService.getBucketRentalById(req.params.id as string))?.version;
      if (!version) return res.status(404).json({ error: 'Bucket rental not found' });
      await LogisticsService.deleteBucketRental(req.params.id as string, version);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  }

  // ----------------------------------------------------
  // VEHICLE PROFITS
  // ----------------------------------------------------
  static async getVehicleProfits(req: Request, res: Response) {
    try {
      const data = await LogisticsService.getVehicleProfits();
      res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  }

  // ----------------------------------------------------
  // OUTSIDE LOADER FEES
  // ----------------------------------------------------
  static async getOutsideLoaderFees(req: Request, res: Response) {
    try {
      const data = await LogisticsService.getOutsideLoaderFees();
      res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  }
}
