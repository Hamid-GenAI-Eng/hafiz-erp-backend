import { Request, Response } from 'express';
import { SyncService } from '../services/SyncService';
import { runSyncWorkerLogic } from '../syncWorker';

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
      const { db } = require('../config/database');
      if (!db) {
        return res.json({ status: 'offline', online: false, pendingChanges: 0, lastSyncedAt: null });
      }

      const { sync_logs } = require('../models/schema');
      const { desc } = require('drizzle-orm');

      const logArray = await db.select().from(sync_logs).orderBy(desc(sync_logs.last_sync)).limit(1);
      
      // Calculate pending changes by pulling local changes (mocking exact count for now)
      // Since this is just status, we can do a lightweight check or just return 0 if unoptimized.
      // For accurate pending, we'd need to count all local tables where updated_at > lastSync.
      // We will leave pendingChanges as 0 for this quick status endpoint unless requested deeply.
      
      let lastSyncedAt = null;
      let status = 'synced';
      
      if (logArray.length > 0) {
        lastSyncedAt = logArray[0].last_sync;
        status = logArray[0].status === 'success' ? 'synced' : 'error';
      } else {
        status = 'pending';
      }

      res.json({
        status,
        online: true,
        pendingChanges: 0,
        lastSyncedAt
      });
    } catch (error: any) {
      res.json({ status: 'offline', online: false, pendingChanges: 0, lastSyncedAt: null });
    }
  }

  static async forceSync(req: Request, res: Response) {
    try {
      await runSyncWorkerLogic();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
