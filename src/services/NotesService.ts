import { eq, desc } from "drizzle-orm";
import { db } from "../config/database";
import { diary_notes } from "../models/schema";
import { randomUUID } from "crypto";

export class NotesService {
  static async getAll() {
    return await db.select().from(diary_notes).orderBy(desc(diary_notes.created_at));
  }

  static async getById(id: string) {
    const results = await db.select().from(diary_notes).where(eq(diary_notes.id, id)).limit(1);
    const note = results.length > 0 ? results[0] : null;
    if (!note) throw new Error("Note not found");
    return note;
  }

  static async create(data: any) {
    const id = randomUUID();
    await db.insert(diary_notes).values({
      id,
      text: data.text || "",
      done: data.done ? 1 : 0,
      date: data.date || new Date().toISOString().split("T")[0],
      created_at: new Date(),
      updated_at: new Date()
    });
    return { id, ...data };
  }

  static async update(id: string, data: any) {
    const results = await db.select().from(diary_notes).where(eq(diary_notes.id, id)).limit(1);
    const existing = results.length > 0 ? results[0] : null;
    if (!existing) throw new Error("Note not found");

    await db.update(diary_notes).set({
      text: data.text !== undefined ? data.text : existing.text,
      done: data.done !== undefined ? (data.done ? 1 : 0) : existing.done,
      date: data.date || existing.date,
      version: existing.version + 1,
      updated_at: new Date()
    }).where(eq(diary_notes.id, id));

    return id;
  }

  static async remove(id: string) {
    const results = await db.select().from(diary_notes).where(eq(diary_notes.id, id)).limit(1);
    const existing = results.length > 0 ? results[0] : null;
    if (!existing) throw new Error("Note not found");
    await db.delete(diary_notes).where(eq(diary_notes.id, id));
  }
}
