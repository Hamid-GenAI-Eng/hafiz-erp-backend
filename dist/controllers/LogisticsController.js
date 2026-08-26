"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticsController = void 0;
const LogisticsService_1 = require("../services/LogisticsService");
class LogisticsController {
    // ----------------------------------------------------
    // VEHICLES
    // ----------------------------------------------------
    static async getAllVehicles(req, res) {
        try {
            const data = await LogisticsService_1.LogisticsService.getAllVehicles();
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async createVehicle(req, res) {
        try {
            const data = await LogisticsService_1.LogisticsService.createVehicle(req.body);
            res.status(201).json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async updateVehicle(req, res) {
        try {
            if (!req.body.version)
                return res.status(400).json({ error: 'version is required' });
            const data = await LogisticsService_1.LogisticsService.updateVehicle(req.params.id, req.body, req.body.version);
            res.json(data);
        }
        catch (err) {
            if (err.message.includes('409'))
                return res.status(409).json({ error: err.message });
            res.status(500).json({ error: err.message });
        }
    }
    static async deleteVehicle(req, res) {
        try {
            const version = req.body?.version || (await LogisticsService_1.LogisticsService.getVehicleById(req.params.id))?.version;
            if (!version)
                return res.status(404).json({ error: 'Vehicle not found' });
            await LogisticsService_1.LogisticsService.deleteVehicle(req.params.id, version);
            res.json({ success: true });
        }
        catch (err) {
            if (err.message.includes('409'))
                return res.status(409).json({ error: err.message });
            res.status(500).json({ error: err.message });
        }
    }
    // ----------------------------------------------------
    // EMPLOYEES
    // ----------------------------------------------------
    static async getAllEmployees(req, res) {
        try {
            const data = await LogisticsService_1.LogisticsService.getAllEmployees();
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async createEmployee(req, res) {
        try {
            const data = await LogisticsService_1.LogisticsService.createEmployee(req.body);
            res.status(201).json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async updateEmployee(req, res) {
        try {
            if (!req.body.version)
                return res.status(400).json({ error: 'version is required' });
            const data = await LogisticsService_1.LogisticsService.updateEmployee(req.params.id, req.body, req.body.version);
            res.json(data);
        }
        catch (err) {
            if (err.message.includes('409'))
                return res.status(409).json({ error: err.message });
            res.status(500).json({ error: err.message });
        }
    }
    static async deleteEmployee(req, res) {
        try {
            const version = req.body?.version || (await LogisticsService_1.LogisticsService.getEmployeeById(req.params.id))?.version;
            if (!version)
                return res.status(404).json({ error: 'Employee not found' });
            await LogisticsService_1.LogisticsService.deleteEmployee(req.params.id, version);
            res.json({ success: true });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    // ----------------------------------------------------
    // EXPENSES
    // ----------------------------------------------------
    static async getAllExpenses(req, res) {
        try {
            const data = await LogisticsService_1.LogisticsService.getAllExpenses();
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async createExpense(req, res) {
        try {
            const data = await LogisticsService_1.LogisticsService.createExpense(req.body);
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
            const data = await LogisticsService_1.LogisticsService.updateExpense(req.params.id, req.body, req.body.version);
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
            const version = req.body?.version || (await LogisticsService_1.LogisticsService.getExpenseById(req.params.id))?.version;
            if (!version)
                return res.status(404).json({ error: 'Expense not found' });
            await LogisticsService_1.LogisticsService.deleteExpense(req.params.id, version);
            res.json({ success: true });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    // ----------------------------------------------------
    // BUCKET RENTALS
    // ----------------------------------------------------
    static async getAllBucketRentals(req, res) {
        try {
            const data = await LogisticsService_1.LogisticsService.getAllBucketRentals();
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async createBucketRental(req, res) {
        try {
            const data = await LogisticsService_1.LogisticsService.createBucketRental(req.body);
            res.status(201).json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async updateBucketRental(req, res) {
        try {
            if (!req.body.version)
                return res.status(400).json({ error: 'version is required' });
            const data = await LogisticsService_1.LogisticsService.updateBucketRental(req.params.id, req.body, req.body.version);
            res.json(data);
        }
        catch (err) {
            if (err.message.includes('409'))
                return res.status(409).json({ error: err.message });
            res.status(500).json({ error: err.message });
        }
    }
    static async deleteBucketRental(req, res) {
        try {
            const version = req.body?.version || (await LogisticsService_1.LogisticsService.getBucketRentalById(req.params.id))?.version;
            if (!version)
                return res.status(404).json({ error: 'Bucket rental not found' });
            await LogisticsService_1.LogisticsService.deleteBucketRental(req.params.id, version);
            res.json({ success: true });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    // ----------------------------------------------------
    // VEHICLE PROFITS
    // ----------------------------------------------------
    static async getVehicleProfits(req, res) {
        try {
            const data = await LogisticsService_1.LogisticsService.getVehicleProfits();
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}
exports.LogisticsController = LogisticsController;
