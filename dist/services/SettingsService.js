"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
class SettingsService {
    static async getSetting(key) {
        const result = await database_1.db.select().from(schema_1.settings).where((0, drizzle_orm_1.eq)(schema_1.settings.key, key)).limit(1);
        return result[0] || null;
    }
    static async setSetting(key, value, incomingVersion) {
        const existing = await this.getSetting(key);
        if (existing) {
            if (incomingVersion !== undefined && existing.version !== incomingVersion) {
                throw new Error('409: Conflict: Setting was modified by another device.');
            }
            const updated = await database_1.db.update(schema_1.settings)
                .set({ value, version: existing.version + 1, updated_at: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.settings.id, existing.id))
                .returning();
            return updated[0];
        }
        else {
            const inserted = await database_1.db.insert(schema_1.settings)
                .values({
                id: (0, crypto_1.randomUUID)(),
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
exports.SettingsService = SettingsService;
