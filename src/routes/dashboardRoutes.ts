import express from 'express';
import { DashboardController } from '../controllers/DashboardController';

const router = express.Router();

router.get('/v2', DashboardController.getDashboardData);

export default router;
