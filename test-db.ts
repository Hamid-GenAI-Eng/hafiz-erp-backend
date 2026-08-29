import postgres from 'postgres';

const sql = postgres('postgresql://postgres:XXIVYwiygoMjC0Ru@db.dmdnvmdrybxxoxppovjn.supabase.co:5432/postgres', { ssl: 'require' });

async function run() {
  try {
    const res = await sql`SELECT 1`;
    console.log("Connected!", res);
    
    // Create the sync_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS "sync_logs" (
        "id" text PRIMARY KEY NOT NULL,
        "synced_at" timestamp DEFAULT now(),
        "status" text DEFAULT 'success',
        "error_details" text,
        "records_synced" integer DEFAULT 0,
        "direction" text DEFAULT 'push'
      );
    `;
    console.log("Created sync_logs table!");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

run();
