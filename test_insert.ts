import postgres from 'postgres';
const sql = postgres('postgres://postgres.dmdnvmdrybxxoxppovjn:e3GARheMgYQUA295@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true', { ssl: 'require' });

async function run() {
  try {
    const newId = crypto.randomUUID();
    await sql.unsafe(`insert into "supplier_ledgers" ("id", "supplier_id", "date", "time", "type", "amount", "payment_amount", "running_balance", "description", "method", "reference", "device_id", "version", "created_at", "updated_at", "deleted_at") values ('${newId}', '4aad63ec-27a5-436e-abe1-671a1fc509ad', '2026-08-23', '13:59', 'payment', 0, 90000, -90000, 'Advance paid for Cement', 'Bank Transfer', 'RCPT-0115', null, 1, '2026-08-23T08:59:50.000Z', '2026-08-23T08:59:50.000Z', null)`);
    console.log('Insert successful! ID:', newId);
  } catch (error) {
    console.error('Detailed Error:', error);
  } finally {
    await sql.end();
  }
}
run();
