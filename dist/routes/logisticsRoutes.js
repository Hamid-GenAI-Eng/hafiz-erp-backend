"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const LogisticsController_1 = require("../controllers/LogisticsController");
const router = (0, express_1.Router)();
// Vehicles
router.get('/vehicles', LogisticsController_1.LogisticsController.getAllVehicles);
router.post('/vehicles', LogisticsController_1.LogisticsController.createVehicle);
router.put('/vehicles/:id', LogisticsController_1.LogisticsController.updateVehicle);
router.delete('/vehicles/:id', LogisticsController_1.LogisticsController.deleteVehicle);
// Employees
router.get('/employees', LogisticsController_1.LogisticsController.getAllEmployees);
router.post('/employees', LogisticsController_1.LogisticsController.createEmployee);
router.put('/employees/:id', LogisticsController_1.LogisticsController.updateEmployee);
router.delete('/employees/:id', LogisticsController_1.LogisticsController.deleteEmployee);
// Expenses
router.get('/expenses', LogisticsController_1.LogisticsController.getAllExpenses);
router.post('/expenses', LogisticsController_1.LogisticsController.createExpense);
router.put('/expenses/:id', LogisticsController_1.LogisticsController.updateExpense);
router.delete('/expenses/:id', LogisticsController_1.LogisticsController.deleteExpense);
// Bucket Rentals
router.get('/bucket-rentals', LogisticsController_1.LogisticsController.getAllBucketRentals);
router.post('/bucket-rentals', LogisticsController_1.LogisticsController.createBucketRental);
router.put('/bucket-rentals/:id', LogisticsController_1.LogisticsController.updateBucketRental);
router.delete('/bucket-rentals/:id', LogisticsController_1.LogisticsController.deleteBucketRental);
// Vehicle Profits & Fees
router.get('/vehicle-profits', LogisticsController_1.LogisticsController.getVehicleProfits);
router.get('/outside-loader-fees', LogisticsController_1.LogisticsController.getOutsideLoaderFees);
exports.default = router;
