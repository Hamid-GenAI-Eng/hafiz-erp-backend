"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceController = void 0;
const InvoiceService_1 = require("../services/InvoiceService");
class InvoiceController {
    static async getAllInvoices(req, res) {
        try {
            const invoices = await InvoiceService_1.InvoiceService.getAllInvoices();
            res.json(invoices);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async getInvoiceById(req, res) {
        try {
            const invoice = await InvoiceService_1.InvoiceService.getInvoiceById(req.params.id);
            if (!invoice)
                return res.status(404).json({ error: 'Invoice not found' });
            res.json(invoice);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async createInvoice(req, res) {
        try {
            const invoice = await InvoiceService_1.InvoiceService.createInvoice(req.body);
            res.status(201).json(invoice);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async updateInvoice(req, res) {
        try {
            const invoice = await InvoiceService_1.InvoiceService.updateInvoice(req.params.id, req.body);
            res.json(invoice);
        }
        catch (err) {
            if (err.message && err.message.includes('Insufficient stock')) {
                res.status(400).json({ error: err.message });
            }
            else {
                res.status(500).json({ error: err.message });
            }
        }
    }
    static async deleteInvoice(req, res) {
        try {
            await InvoiceService_1.InvoiceService.deleteInvoice(req.params.id);
            res.json({ success: true });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}
exports.InvoiceController = InvoiceController;
