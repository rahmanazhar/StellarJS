import express from 'express';
import { createServer, createAuthService } from 'stellar-js';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Create StellarJS server
const stellarServer = createServer({
  port: parseInt(process.env.PORT || '3000', 10),
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    tokenExpiration: '24h',
  },
});

// Create auth service
const authService = createAuthService({
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  tokenExpiration: '24h',
});

// Register auth service routes
stellarServer.registerService({
  name: 'auth',
  routes: [
    {
      path: '/login',
      method: 'POST',
      handler: authService.login.bind(authService),
    },
    {
      path: '/register',
      method: 'POST',
      handler: authService.register.bind(authService),
    },
  ],
});

// Add your custom routes here
stellarServer.getApp().get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
stellarServer
  .start()
  .then(() => {
    console.log('Server is ready!');
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
