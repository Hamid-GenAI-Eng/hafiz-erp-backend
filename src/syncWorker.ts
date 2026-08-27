import { DB_TYPE, db } from './config/database';
import { SyncService } from './services/SyncService';
import { sync_logs } from './models/schema';
import { desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const REMOTE_URL = process.env.REMOTE_URL || 'http://localhost:3002'; // Replace with prod URL

async function getLastSyncTime(): Promise<Date> {
  const logArray = await db.select().from(sync_logs).orderBy(desc(sync_logs.last_sync)).limit(1);
  if (logArray.length > 0) {
    return new Date(logArray[0].last_sync);
  }
  return new Date(0);
}

async function updateLastSyncTime(date: Date, status: string, error?: string) {
  await db.insert(sync_logs).values({
    id: randomUUID(),
    last_sync: date,
    status,
    error: error || null
  });
}

export function startSyncWorker() {
  if (DB_TYPE !== 'sqlite') {
    console.log('Sync Worker: Disabled (Running in Postgres/Remote mode)');
    return;
  }
  
  console.log('Sync Worker: Started (Running in Local/SQLite mode)');

  // Run every 60 seconds
  setInterval(async () => {
    try {
      const lastSync = await getLastSyncTime();
      
      // 1. Fetch local changes since last sync
      const localChanges = await SyncService.pullChanges(lastSync);
      
      // Check if we actually have any local changes (optimization)
      let hasLocalChanges = false;
      for (const key of Object.keys(localChanges)) {
        if (localChanges[key] && localChanges[key].length > 0) hasLocalChanges = true;
      }

      // 2. Push to remote
      if (hasLocalChanges) {
        const pushRes = await fetch(`${REMOTE_URL}/api/sync/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ changes: localChanges })
        });
        if (!pushRes.ok) throw new Error('Failed to push changes to remote');
      }

      // 3. Pull from remote
      const pullRes = await fetch(`${REMOTE_URL}/api/sync/pull?lastSync=${lastSync.toISOString()}`);
      if (!pullRes.ok) throw new Error('Failed to pull changes from remote');
      const remoteChanges = await pullRes.json();

      // Check if we actually have any remote changes
      let hasRemoteChanges = false;
      for (const key of Object.keys(remoteChanges)) {
        if (remoteChanges[key] && remoteChanges[key].length > 0) hasRemoteChanges = true;
      }

      // 4. Apply remote changes locally
      if (hasRemoteChanges) {
        await SyncService.pushChanges(remoteChanges);
      }

      // 5. Update last sync time
      if (hasLocalChanges || hasRemoteChanges) {
        await updateLastSyncTime(new Date(), 'success');
        console.log(`Sync completed successfully at ${new Date().toISOString()}`);
      }

    } catch (err: any) {
      console.error('Sync Worker Error:', err.message);
      await updateLastSyncTime(new Date(), 'failed', err.message).catch(e => console.error('Failed to log sync error', e));
    }
  }, 60000); // 60 seconds
}
