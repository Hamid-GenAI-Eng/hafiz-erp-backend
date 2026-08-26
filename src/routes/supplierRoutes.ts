import { Router } from 'express';
import { SupplierController } from '../controllers/SupplierController';

const router = Router();

// Supplier CRUD
router.get('/', SupplierController.getAllSuppliers);
router.post('/', SupplierController.createSupplier);
router.get('/:id', SupplierController.getSupplierById);
router.put('/:id', SupplierController.updateSupplier);
router.delete('/:id', SupplierController.deleteSupplier);

// Supplier Ledgers
router.get('/:id/ledger', SupplierController.getLedgerHistory);
router.post('/:id/ledger', SupplierController.createLedgerEntry);
router.put('/:id/ledger/:ledgerId', SupplierController.updateLedgerEntry);
// NOTE: DELETE for ledgers is deliberately omitted to enforce audit trail policy (edit/reversing only)

export default router;
