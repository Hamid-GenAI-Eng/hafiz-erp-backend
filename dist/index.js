"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const crmRoutes_1 = __importDefault(require("./routes/crmRoutes"));
const supplierRoutes_1 = __importDefault(require("./routes/supplierRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const logisticsRoutes_1 = __importDefault(require("./routes/logisticsRoutes"));
const miscRoutes_1 = __importDefault(require("./routes/miscRoutes"));
const invoiceRoutes_1 = __importDefault(require("./routes/invoiceRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/customers', crmRoutes_1.default);
app.use('/api/suppliers', supplierRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
app.use('/api/logistics', logisticsRoutes_1.default);
app.use('/api/misc', miscRoutes_1.default);
app.use('/api/invoices', invoiceRoutes_1.default);
app.use('/api/settings', settingsRoutes_1.default);
// Dummy endpoint to prevent frontend 404 errors from Header.tsx polling
app.get('/api/notifications', (req, res) => {
    res.json([]);
});
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
