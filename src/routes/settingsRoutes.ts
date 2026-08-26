import { Router } from 'express';
import { SettingsController } from '../controllers/SettingsController';

const router = Router();

router.get('/:key', SettingsController.getSetting);
router.put('/:key', SettingsController.setSetting);

export default router;
