import { Router } from 'express';
import { SyncController } from '../controllers/SyncController';

const router = Router();

router.get('/pull', SyncController.pullChanges);
router.post('/push', SyncController.pushChanges);
router.get('/status', SyncController.getStatus);
router.post('/force', SyncController.forceSync);

export default router;
