import { db } from '../config/database';
import { settings } from '../models/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class SettingsService {
  static async getSetting(key: string) {
    const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return result[0] || null;
  }

  static async setSetting(key: string, value: string, incomingVersion?: number) {
    const existing = await this.getSetting(key);
    if (existing) {
      if (incomingVersion !== undefined && existing.version !== incomingVersion) {
        throw new Error('409: Conflict: Setting was modified by another device.');
      }
      const updated = await db.update(settings)
        .set({ value, version: existing.version + 1, updated_at: new Date() })
        .where(eq(settings.id, existing.id))
        .returning();
      return updated[0];
    } else {
      const inserted = await db.insert(settings)
        .values({
          id: randomUUID(),
          key,
          value,
          version: 1,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning();
      return inserted[0];
    }
  }
}
