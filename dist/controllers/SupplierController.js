"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierController = void 0;
const SupplierService_1 = require("../services/SupplierService");
const crypto_1 = require("crypto");
class SupplierController {
    static async getAllSuppliers(req, res) {
        try {
            const suppliers = await SupplierService_1.SupplierService.getAllSuppliers();
            res.json(suppliers);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
    static async getSupplierById(req, res) {
        try {
            const supplier = await SupplierService_1.SupplierService.getSupplierById(req.params.id);
            if (!supplier) {
                return res.status(404).json({ error: 'Supplier not found' });
            }
            res.json(supplier);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
    static async createSupplier(req, res) {
        try {
            // Auto-generate UUID and Supplier Number
            const newId = (0, crypto_1.randomUUID)();
            const supplierNumber = `SUPP-${Math.floor(Math.random() * 100000)}`;
            const data = {
                id: newId,
                supplier_number: supplierNumber,
                company_name: req.body.company_name,
                contact_person: req.body.contact_person,
                phone: req.body.phone,
                email: req.body.email,
                address: req.body.address,
                category: req.body.category || 'Building',
                tax_id: req.body.tax_id,
                status: req.body.status || 'active',
                balance_owed: req.body.opening_balance || 0
            };
            const supplier = await SupplierService_1.SupplierService.createSupplier(data);
            res.status(201).json(supplier);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
    static async updateSupplier(req, res) {
        try {
            const incomingVersion = req.body.version;
            if (!incomingVersion)
                return res.status(400).json({ error: 'Version is required' });
            const supplier = await SupplierService_1.SupplierService.updateSupplier(req.params.id, req.body, incomingVersion);
            res.json(supplier);
        }
        catch (err) {
            console.error(err);
            if (err.message.includes('409')) {
                return res.status(409).json({ error: 'Conflict: Supplier was modified by another device. Please refresh.' });
            }
            res.status(500).json({ error: err.message });
        }
    }
    static async deleteSupplier(req, res) {
        try {
            let version = req.body?.version;
            if (!version) {
                const existing = await SupplierService_1.SupplierService.getSupplierById(req.params.id);
                if (!existing)
                    return res.status(404).json({ error: 'Supplier not found' });
                version = existing.version;
            }
            await SupplierService_1.SupplierService.deleteSupplier(req.params.id, version);
            res.json({ success: true });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
    // --- Ledgers ---
    static async getLedgerHistory(req, res) {
        try {
            const history = await SupplierService_1.SupplierService.getLedgerHistory(req.params.id);
            res.json(history);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
    static async createLedgerEntry(req, res) {
        try {
            const data = {
                id: (0, crypto_1.randomUUID)(),
                supplier_id: req.params.id,
                date: req.body.date,
                time: req.body.time,
                type: req.body.type,
                amount: req.body.amount || 0,
                payment_amount: req.body.payment_amount || 0,
                description: req.body.description,
                method: req.body.method,
                reference: req.body.reference
            };
            const entry = await SupplierService_1.SupplierService.createLedgerEntry(data);
            res.status(201).json(entry);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
    static async updateLedgerEntry(req, res) {
        try {
            const incomingVersion = req.body.version;
            if (!incomingVersion)
                return res.status(400).json({ error: 'Version is required for updates' });
            const entry = await SupplierService_1.SupplierService.updateLedgerEntry(req.params.ledgerId, incomingVersion, {
                amount: req.body.amount || 0,
                payment_amount: req.body.payment_amount || 0,
                description: req.body.description,
                date: req.body.date,
                time: req.body.time,
                method: req.body.method,
                reference: req.body.reference
            });
            res.json(entry);
        }
        catch (err) {
            console.error(err);
            if (err.message.includes('409')) {
                return res.status(409).json({ error: 'Conflict: Ledger entry was modified by another device. Please refresh.' });
            }
            res.status(500).json({ error: err.message });
        }
    }
}
exports.SupplierController = SupplierController;
