import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import crmRoutes from './routes/crmRoutes';
import supplierRoutes from './routes/supplierRoutes';
import productRoutes from './routes/productRoutes';
import logisticsRoutes from './routes/logisticsRoutes';
import miscRoutes from './routes/miscRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import settingsRoutes from './routes/settingsRoutes';
import diaryRoutes from './routes/diary';
import notesRoutes from './routes/notes';
import dashboardRoutes from './routes/dashboardRoutes';
import notificationRoutes from './routes/notificationRoutes';
import syncRoutes from './routes/syncRoutes';
import { startSyncWorker } from './syncWorker';
import { initializeDatabase, getDb, DB_TYPE } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', crmRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/misc', miscRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sync', syncRoutes);

app.get('/', (req, res) => {
  res.send('Hafiz ERP Backend is running! API is accessible at /api');
});

app.get('/api/health', (req, res) => {
  try {
    const db = getDb(); // Verify database is accessible
    res.json({ status: 'ok', database: DB_TYPE, dbReady: true, timestamp: new Date().toISOString() });
  } catch (e: any) {
    res.status(503).json({ status: 'error', database: DB_TYPE, dbReady: false, error: e.message });
  }
});

if (process.env.VERCEL) {
  // Initialize synchronously for serverless environment
  initializeDatabase();
} else {
  try {
    initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
      startSyncWorker();
    });
  } catch (err) {
    console.error("FATAL: Failed to initialize database on startup:", err);
    process.exit(1);
  }
}

export default app;
