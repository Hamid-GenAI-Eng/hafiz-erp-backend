import { initializeDatabase } from './src/config/database'; import { DiaryService } from './src/services/DiaryService';

async function run() {
  try {
    initializeDatabase();
    await DiaryService.settleMultiple({
      ids: ['6ad1371f-881a-4ff4-8f4c-639c72f6f56b'], 
      shipping: 0, internal_shipping: 0, outside_loader_fee: 0, loaders: []
    });
    console.log('Success');
  } catch(e) {
    console.error('Failed:', e);
  }
}
run();
