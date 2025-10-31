import { AppConfig, ServerConfig } from '../types';
import { createLogger } from './helpers';

const logger = createLogger('Config');

/**
 * Validate application configuration
 */
export const validateAppConfig = (config: Partial<AppConfig>): config is AppConfig => {
  if (!config.apiUrl) {
    logger.error('apiUrl is required in configuration');
    return false;
  }

  if (!config.auth || !config.auth.jwtSecret) {
    logger.error('auth.jwtSecret is required in configuration');
    return false;
  }

  return true;
};

/**
 * Validate server configuration
 */
export const validateServerConfig = (config: Partial<ServerConfig>): config is ServerConfig => {
  if (!config.port || typeof config.port !== 'number') {
    logger.error('Valid port number is required in server configuration');
    return false;
  }

  if (!config.auth || !config.auth.jwtSecret) {
    logger.error('auth.jwtSecret is required in server configuration');
    return false;
  }

  return true;
};

/**
 * Load configuration from environment variables
 */
export const loadConfigFromEnv = (): Partial<ServerConfig> => {
  return {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    auth: {
      jwtSecret: process.env.JWT_SECRET || '',
      tokenExpiration: process.env.JWT_EXPIRATION || '24h',
    },
  };
};

/**
 * Merge configurations with defaults
 */
export const mergeConfig = <T extends Record<string, any>>(
  defaults: T,
  overrides: Partial<T>
): T => {
  const merged = { ...defaults };

  for (const key in overrides) {
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      const value = overrides[key];
      if (value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          merged[key] = mergeConfig(merged[key] || ({} as any), value as any) as T[Extract<
            keyof T,
            string
          >];
        } else {
          merged[key] = value as T[Extract<keyof T, string>];
        }
      }
    }
  }

  return merged;
};

/**
 * Get environment name
 */
export const getEnvironment = (): string => {
  return process.env.NODE_ENV || 'development';
};

/**
 * Check if running in production
 */
export const isProduction = (): boolean => {
  return getEnvironment() === 'production';
};

/**
 * Check if running in development
 */
export const isDevelopment = (): boolean => {
  return getEnvironment() === 'development';
};

/**
 * Check if running in test
 */
export const isTest = (): boolean => {
  return getEnvironment() === 'test';
};

/**
 * Load configuration with environment-specific overrides
 */
export const loadConfig = <T extends Record<string, any>>(
  baseConfig: T,
  envConfigs?: Record<string, Partial<T>>
): T => {
  const env = getEnvironment();
  const envConfig = envConfigs?.[env] || {};
  const envVarConfig = loadConfigFromEnv() as Partial<T>;

  return mergeConfig(mergeConfig(baseConfig, envConfig), envVarConfig);
};
