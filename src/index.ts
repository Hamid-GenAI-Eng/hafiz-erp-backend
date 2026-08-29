import express from 'express';

let appError: any = null;
let app: any;

try {
  // Try to load the main application
  app = require('./app').default;
} catch (error: any) {
  appError = error;
  app = express();
  
  // Return the initialization error on all requests so we can debug Vercel crashes without logs
  app.use((req: any, res: any) => {
    res.status(500).json({
      error: 'Backend failed to initialize on Vercel',
      message: appError.message,
      stack: appError.stack
    });
  });
}

export default app;
