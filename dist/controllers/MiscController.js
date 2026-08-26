"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiscController = void 0;
const MiscService_1 = require("../services/MiscService");
class MiscController {
    static async getAllExpenses(req, res) {
        try {
            const data = await MiscService_1.MiscService.getAllExpenses();
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async createExpense(req, res) {
        try {
            const data = await MiscService_1.MiscService.createExpense(req.body);
            res.status(201).json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async updateExpense(req, res) {
        try {
            if (!req.body.version)
                return res.status(400).json({ error: 'version is required' });
            const data = await MiscService_1.MiscService.updateExpense(req.params.id, req.body, req.body.version);
            res.json(data);
        }
        catch (err) {
            if (err.message.includes('409'))
                return res.status(409).json({ error: err.message });
            res.status(500).json({ error: err.message });
        }
    }
    static async deleteExpense(req, res) {
        try {
            const version = req.body?.version || (await MiscService_1.MiscService.getExpenseById(req.params.id))?.version;
            if (!version)
                return res.status(404).json({ error: 'Expense not found' });
            await MiscService_1.MiscService.deleteExpense(req.params.id, version);
            res.json({ success: true });
        }
        catch (err) {
            if (err.message.includes('409'))
                return res.status(409).json({ error: err.message });
            res.status(500).json({ error: err.message });
        }
    }
}
exports.MiscController = MiscController;
