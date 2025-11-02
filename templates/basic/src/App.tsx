import React from 'react';
import { StellarApp } from 'stellar-js';
import Router from './Router';

const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  },
  services: {},
};

function App() {
  return (
    <StellarApp config={config}>
      <div className="app">
        <Router />
      </div>
    </StellarApp>
  );
}

export default App;
