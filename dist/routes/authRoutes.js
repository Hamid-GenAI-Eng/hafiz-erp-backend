"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/login', AuthController_1.AuthController.login);
// Example protected route for testing
router.get('/me', auth_1.authenticateToken, (req, res) => {
    res.json({ user: req.user });
});
// Example route restricted to Admin only
router.get('/admin-only', auth_1.authenticateToken, (0, auth_1.requireRole)(['Admin']), (req, res) => {
    res.json({ message: 'Welcome Admin' });
});
exports.default = router;
