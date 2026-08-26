import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: './src/models/schema.ts',
  out: './drizzle',
  dialect: 'sqlite', // for local dev
  dbCredentials: {
    url: 'sqlite.db',
  }
});
