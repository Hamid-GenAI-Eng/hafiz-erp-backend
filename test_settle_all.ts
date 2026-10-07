import { initializeDatabase, getDb } from './src/config/database'; import { DiaryService } from './src/services/DiaryService'; import { diary } from './src/models/schema'; import { eq } from 'drizzle-orm';

async function run() {
  try {
    initializeDatabase();
    const db = getDb();
    const entries = await db.select().from(diary).where(eq(diary.customer_name, 'Iftikhar Butt'));
    const ids = entries.filter((e: any) => e.status !== 'ledgered').map((e: any) => e.id);
    if(ids.length === 0) { console.log('None to settle'); return; }
    await DiaryService.settleMultiple({
      ids, 
      shipping: 0, internal_shipping: 0, outside_loader_fee: 0, loaders: []
    });
    console.log('Success, settled ' + ids.length + ' entries');
  } catch(e) {
    console.error('Failed:', e);
  }
}
run();
