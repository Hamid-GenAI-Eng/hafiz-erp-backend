"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-hafiz-key-2026';
class AuthController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ error: 'Email and password are required' });
                return;
            }
            let role = null;
            // Hardcoded check
            if (email === 'hafizerp@code.com' && password === 'Master@12345') {
                role = 'Admin';
            }
            else if (email === 'hafizerp@code.com' && password === 'Accountant@12345') {
                role = 'Accountant';
            }
            if (!role) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }
            // Generate JWT
            const token = jsonwebtoken_1.default.sign({ email, role }, JWT_SECRET, { expiresIn: '24h' });
            res.status(200).json({
                message: 'Login successful',
                token,
                user: {
                    email,
                    role
                }
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.AuthController = AuthController;
