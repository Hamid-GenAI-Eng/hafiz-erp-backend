"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SupplierController_1 = require("../controllers/SupplierController");
const router = (0, express_1.Router)();
// Supplier CRUD
router.get('/', SupplierController_1.SupplierController.getAllSuppliers);
router.post('/', SupplierController_1.SupplierController.createSupplier);
router.get('/:id', SupplierController_1.SupplierController.getSupplierById);
router.put('/:id', SupplierController_1.SupplierController.updateSupplier);
router.delete('/:id', SupplierController_1.SupplierController.deleteSupplier);
// Supplier Ledgers
router.get('/:id/ledger', SupplierController_1.SupplierController.getLedgerHistory);
router.post('/:id/ledger', SupplierController_1.SupplierController.createLedgerEntry);
router.put('/:id/ledger/:ledgerId', SupplierController_1.SupplierController.updateLedgerEntry);
// NOTE: DELETE for ledgers is deliberately omitted to enforce audit trail policy (edit/reversing only)
exports.default = router;
