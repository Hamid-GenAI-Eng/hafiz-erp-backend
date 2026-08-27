import { Router } from 'express';
import { LogisticsController } from '../controllers/LogisticsController';

const router = Router();

// Vehicles
router.get('/vehicles', LogisticsController.getAllVehicles);
router.post('/vehicles', LogisticsController.createVehicle);
router.put('/vehicles/:id', LogisticsController.updateVehicle);
router.delete('/vehicles/:id', LogisticsController.deleteVehicle);

// Employees
router.get('/employees', LogisticsController.getAllEmployees);
router.post('/employees', LogisticsController.createEmployee);
router.put('/employees/:id', LogisticsController.updateEmployee);
router.delete('/employees/:id', LogisticsController.deleteEmployee);

// Expenses
router.get('/expenses', LogisticsController.getAllExpenses);
router.post('/expenses', LogisticsController.createExpense);
router.put('/expenses/:id', LogisticsController.updateExpense);
router.delete('/expenses/:id', LogisticsController.deleteExpense);

// Bucket Rentals
router.get('/bucket-rentals', LogisticsController.getAllBucketRentals);
router.post('/bucket-rentals', LogisticsController.createBucketRental);
router.put('/bucket-rentals/:id', LogisticsController.updateBucketRental);
router.delete('/bucket-rentals/:id', LogisticsController.deleteBucketRental);

// Vehicle Profits & Fees
router.get('/vehicle-profits', LogisticsController.getVehicleProfits);
router.get('/outside-loader-fees', LogisticsController.getOutsideLoaderFees);

export default router;
