import React from 'react';
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { useEffect } from 'react';

export interface StellarPhpConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  auth?: {
    token?: string;
    type?: 'Bearer' | 'Basic';
  };
}

export class StellarPhpClient {
  private client: AxiosInstance;
  private config: StellarPhpConfig;

  constructor(config: StellarPhpConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL.endsWith('/') ? config.baseURL : `${config.baseURL}/`,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add auth token if available
        if (this.config.auth?.token) {
          const authType = this.config.auth.type || 'Bearer';
          config.headers = config.headers || {};
          config.headers.Authorization = `${authType} ${this.config.auth.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: unknown) => {
        // Handle common error scenarios
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status: number } };
          if (axiosError.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            this.clearAuth();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async login(credentials: { email: string; password: string }) {
    try {
      const response = await this.client.post('auth/login', credentials);
      if (response.data.token) {
        this.setAuthToken(response.data.token);
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  setAuthToken(token: string, type: 'Bearer' | 'Basic' = 'Bearer') {
    this.config.auth = { token, type };
    localStorage.setItem('stellar_auth_token', token);
    localStorage.setItem('stellar_auth_type', type);
  }

  clearAuth() {
    this.config.auth = undefined;
    localStorage.removeItem('stellar_auth_token');
    localStorage.removeItem('stellar_auth_type');
  }

  // Generic HTTP methods
  async get<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get(endpoint, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async put<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.put(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete(endpoint, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // CRUD operations helper
  async findAll<T = any>(resource: string, params?: Record<string, any>): Promise<T[]> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`${resource}${queryString}`);
  }

  async findById<T = any>(resource: string, id: string | number): Promise<T> {
    return this.get(`${resource}/${id}`);
  }

  async create<T = any>(resource: string, data: any): Promise<T> {
    return this.post(resource, data);
  }

  async update<T = any>(resource: string, id: string | number, data: any): Promise<T> {
    return this.put(`${resource}/${id}`, data);
  }

  async remove<T = any>(resource: string, id: string | number): Promise<T> {
    return this.delete(`${resource}/${id}`);
  }

  // File upload helper
  async uploadFile(endpoint: string, file: File, additionalData?: Record<string, any>) {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
    }

    try {
      const response = await this.client.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.get('health');
      return response;
    } catch (error) {
      console.warn('API health check failed:', error);
      return { status: 'error', message: 'API unavailable' };
    }
  }

  private handleError(error: any) {
    if (error.response) {
      // Server responded with error status
      return {
        status: error.response.status,
        message: error.response.data?.message || error.response.statusText,
        data: error.response.data,
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        status: 0,
        message: 'Network error - please check your connection',
        data: null,
      };
    } else {
      // Something else happened
      return {
        status: -1,
        message: error.message || 'An unexpected error occurred',
        data: null,
      };
    }
  }
}

// React hook for using the PHP client
export function useStellarPhp(config?: Partial<StellarPhpConfig>) {
  const defaultConfig: StellarPhpConfig = {
    baseURL: process.env.REACT_APP_API_URL || '/api',
    timeout: 10000,
  };

  const client = new StellarPhpClient({ ...defaultConfig, ...config });

  // Restore auth token on initialization
  useEffect(() => {
    const token = localStorage.getItem('stellar_auth_token');
    const type = localStorage.getItem('stellar_auth_type') as 'Bearer' | 'Basic';
    if (token) {
      client.setAuthToken(token, type || 'Bearer');
    }
  }, [client]);

  return client;
}

// User resource helper
export class UserResource {
  constructor(private client: StellarPhpClient) {}

  async getAll(params?: { page?: number; limit?: number; search?: string }) {
    return this.client.findAll('users', params);
  }

  async getById(id: string | number) {
    return this.client.findById('users', id);
  }

  async create(userData: { name: string; email: string; password?: string }) {
    return this.client.create('users', userData);
  }

  async update(id: string | number, userData: Partial<{ name: string; email: string }>) {
    return this.client.update('users', id, userData);
  }

  async delete(id: string | number) {
    return this.client.remove('users', id);
  }
}

// Export factory function for creating configured client
export function createStellarPhpClient(config: StellarPhpConfig) {
  const client = new StellarPhpClient(config);

  return {
    client,
    users: new UserResource(client),
    // Add more resources as needed
  };
}

export default StellarPhpClient;
