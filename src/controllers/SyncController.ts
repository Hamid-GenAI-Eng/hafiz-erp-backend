import { Request, Response } from 'express';
import { SyncService } from '../services/SyncService';

export class SyncController {
  static async pullChanges(req: Request, res: Response) {
    try {
      const lastSyncStr = req.query.lastSync as string;
      const lastSync = lastSyncStr ? new Date(lastSyncStr) : new Date(0);
      
      const changes = await SyncService.pullChanges(lastSync);
      res.json(changes);
    } catch (error: any) {
      console.error('Error pulling changes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async pushChanges(req: Request, res: Response) {
    try {
      const clientChanges = req.body.changes;
      if (!clientChanges) {
        return res.status(400).json({ error: 'No changes provided' });
      }

      const results = await SyncService.pushChanges(clientChanges);
      res.json({ success: true, results });
    } catch (error: any) {
      console.error('Error pushing changes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getStatus(req: Request, res: Response) {
    try {
      // Import here to avoid circular dependencies if any
      const { db } = require('../config/database');
      const { sync_logs } = require('../models/schema');
      const { desc } = require('drizzle-orm');

      const logArray = await db.select().from(sync_logs).orderBy(desc(sync_logs.last_sync)).limit(1);
      if (logArray.length > 0) {
        res.json({ last_sync: logArray[0].last_sync, status: logArray[0].status, error: logArray[0].error });
      } else {
        res.json({ last_sync: null, status: 'never_synced' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
