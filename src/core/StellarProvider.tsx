import React, { createContext, useContext } from 'react';
import { AppConfig } from '../types';

interface StellarContextType {
  config: AppConfig;
}

const StellarContext = createContext<StellarContextType | undefined>(undefined);

export const useStellar = () => {
  const context = useContext(StellarContext);
  if (!context) {
    throw new Error('useStellar must be used within a StellarProvider');
  }
  return context;
};

interface StellarProviderProps {
  config: AppConfig;
  children: React.ReactNode;
}

export const StellarProvider: React.FC<StellarProviderProps> = ({ config, children }) => {
  return <StellarContext.Provider value={{ config }}>{children}</StellarContext.Provider>;
};
