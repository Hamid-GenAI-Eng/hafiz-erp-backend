import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.post('/login', AuthController.login);

// Example protected route for testing
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Example route restricted to Admin only
router.get('/admin-only', authenticateToken, requireRole(['Admin']), (req, res) => {
  res.json({ message: 'Welcome Admin' });
});

export default router;
