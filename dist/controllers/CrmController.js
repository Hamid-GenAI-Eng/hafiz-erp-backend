"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmController = void 0;
const CrmService_1 = require("../services/CrmService");
const crypto_1 = require("crypto");
class CrmController {
    static async getAllCustomers(req, res) {
        try {
            const customers = await CrmService_1.CrmService.getAllCustomers();
            res.json(customers);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
    static async getCustomerById(req, res) {
        try {
            const customer = await CrmService_1.CrmService.getCustomerById(req.params.id);
            if (!customer) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            res.json(customer);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
    static async createCustomer(req, res) {
        try {
            // In a real app, customer_number should be generated atomically on the server
            const newId = (0, crypto_1.randomUUID)();
            const customerNumber = `CUST-${Math.floor(Math.random() * 100000)}`;
            const data = {
                id: newId,
                customer_number: customerNumber,
                name: req.body.name,
                phone: req.body.phone,
                address: req.body.address,
                status: req.body.status || 'active',
                balance: req.body.balance || 0
            };
            const customer = await CrmService_1.CrmService.createCustomer(data);
            res.status(201).json(customer);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
    static async updateCustomer(req, res) {
        try {
            const incomingVersion = req.body.version;
            if (!incomingVersion)
                return res.status(400).json({ error: 'Version is required' });
            const customer = await CrmService_1.CrmService.updateCustomer(req.params.id, req.body, incomingVersion);
            res.json(customer);
        }
        catch (err) {
            console.error(err);
            if (err.message.includes('409')) {
                return res.status(409).json({ error: 'Conflict: Customer was modified by another device. Please refresh.' });
            }
            res.status(500).json({ error: err.message });
        }
    }
    static async deleteCustomer(req, res) {
        try {
            let version = req.body?.version;
            if (!version) {
                const existing = await CrmService_1.CrmService.getCustomerById(req.params.id);
                if (!existing)
                    return res.status(404).json({ error: 'Customer not found' });
                version = existing.version;
            }
            await CrmService_1.CrmService.deleteCustomer(req.params.id, version);
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
            const history = await CrmService_1.CrmService.getLedgerHistory(req.params.id);
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
                customer_id: req.params.id,
                date: req.body.date,
                time: req.body.time,
                type: req.body.type,
                amount: req.body.amount || 0,
                payment_amount: req.body.payment_amount || 0,
                description: req.body.description,
                method: req.body.method,
                reference: req.body.reference
            };
            const entry = await CrmService_1.CrmService.createLedgerEntry(data);
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
            const entry = await CrmService_1.CrmService.updateLedgerEntry(req.params.ledgerId, incomingVersion, {
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
exports.CrmController = CrmController;
