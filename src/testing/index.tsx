import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { StellarProvider } from '../core/StellarProvider';
import { AppConfig } from '../types';

/**
 * Default test configuration
 */
const defaultConfig: AppConfig = {
  apiUrl: 'http://localhost:3000',
  auth: {
    jwtSecret: 'test-secret',
  },
  services: {},
};

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  config: Partial<AppConfig> = {},
  options?: Omit<RenderOptions, 'wrapper'>
): ReturnType<typeof render> {
  const mergedConfig = { ...defaultConfig, ...config };

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <StellarProvider config={mergedConfig}>
        <BrowserRouter>{children}</BrowserRouter>
      </StellarProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Create mock service for testing
 */
export function createMockService<T>(methods: Partial<T>): T {
  return methods as T;
}

/**
 * Mock fetch for testing
 */
export function mockFetch(data: any, status = 200) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      headers: new Headers(),
    } as Response)
  );
}

/**
 * Wait for async updates
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock localStorage
 */
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

/**
 * Setup test environment
 */
export function setupTestEnvironment() {
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: mockLocalStorage,
    writable: true,
  });

  // Mock console methods to reduce noise in tests
  global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
  };
}

/**
 * Create mock request for Express testing
 */
export function createMockRequest(options: {
  body?: any;
  params?: any;
  query?: any;
  headers?: Record<string, string>;
  method?: string;
  url?: string;
}): any {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    method: options.method || 'GET',
    url: options.url || '/',
    get: function (header: string) {
      return this.headers[header.toLowerCase()];
    },
  };
}

/**
 * Create mock response for Express testing
 */
export function createMockResponse(): any {
  const res: any = {
    statusCode: 200,
    data: null,
    headers: {} as Record<string, string>,
  };

  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });

  res.json = jest.fn((data: any) => {
    res.data = data;
    return res;
  });

  res.send = jest.fn((data: any) => {
    res.data = data;
    return res;
  });

  res.setHeader = jest.fn((key: string, value: string) => {
    res.headers[key] = value;
    return res;
  });

  res.getHeader = jest.fn((key: string) => {
    return res.headers[key];
  });

  return res;
}

/**
 * Create mock next function for middleware testing
 */
export function createMockNext(): jest.Mock {
  return jest.fn();
}

// Re-export testing library utilities
export * from '@testing-library/react';
export { renderWithProviders as render };
