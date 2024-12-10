import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { StellarProvider } from './StellarProvider';
import { AppConfig } from '../types';

interface StellarAppProps {
  config: AppConfig;
  children: React.ReactNode;
}

export const StellarApp: React.FC<StellarAppProps> = ({ config, children }) => {
  return (
    <StellarProvider config={config}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </StellarProvider>
  );
};
