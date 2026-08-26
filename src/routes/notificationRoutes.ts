import express from 'express';
import { NotificationController } from '../controllers/NotificationController';

const router = express.Router();

router.get('/', NotificationController.getNotifications);

export default router;
