import React from 'react';
import { StellarApp } from '@rahmanazhar/stellar-js';
import Router from './Router';

const config = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  },
};

function App() {
  return (
    <StellarApp config={config}>
      <Router />
    </StellarApp>
  );
}

export default App;
