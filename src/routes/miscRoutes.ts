import { Router } from 'express';
import { MiscController } from '../controllers/MiscController';

const router = Router();

router.get('/expenses', MiscController.getAllExpenses);
router.post('/expenses', MiscController.createExpense);
router.put('/expenses/:id', MiscController.updateExpense);
router.delete('/expenses/:id', MiscController.deleteExpense);

export default router;
