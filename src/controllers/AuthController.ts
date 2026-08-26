import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../models/types';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-hafiz-key-2026';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      let role: Role | null = null;

      // Hardcoded check
      if (email === 'hafizerp@code.com' && password === 'Master@12345') {
        role = 'Admin';
      } else if (email === 'hafizerp@code.com' && password === 'Accountant@12345') {
        role = 'Accountant';
      }

      if (!role) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate JWT
      const token = jwt.sign(
        { email, role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          email,
          role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
