"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
let appError = null;
let app;
try {
    // Try to load the main application
    app = require('./app').default;
}
catch (error) {
    appError = error;
    app = (0, express_1.default)();
    // Return the initialization error on all requests so we can debug Vercel crashes without logs
    app.use((req, res) => {
        res.status(500).json({
            error: 'Backend failed to initialize on Vercel',
            message: appError.message,
            stack: appError.stack
        });
    });
}
exports.default = app;
