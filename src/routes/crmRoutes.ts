import { Router } from 'express';
import { CrmController } from '../controllers/CrmController';

const router = Router();

router.get('/', CrmController.getAllCustomers);
router.get('/:id', CrmController.getCustomerById);
router.post('/', CrmController.createCustomer);
router.put('/:id', CrmController.updateCustomer);
router.delete('/:id', CrmController.deleteCustomer);

router.get('/:id/ledger', CrmController.getLedgerHistory);
router.post('/:id/ledger', CrmController.createLedgerEntry);
router.put('/:id/ledger/:ledgerId', CrmController.updateLedgerEntry);

export default router;
