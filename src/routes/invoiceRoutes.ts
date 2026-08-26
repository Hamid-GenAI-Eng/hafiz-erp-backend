import { Router } from 'express';
import { InvoiceController } from '../controllers/InvoiceController';

const router = Router();

router.get('/', InvoiceController.getAllInvoices);
router.get('/:id', InvoiceController.getInvoiceById);
router.post('/', InvoiceController.createInvoice);
router.put('/:id', InvoiceController.updateInvoice);
router.delete('/:id', InvoiceController.deleteInvoice);

export default router;
