import { useState, useCallback } from 'react';
import { useStellar } from '../core/StellarProvider';
import { ServiceResponse } from '../types';

interface UseServiceOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UseServiceState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export function useService<T = any>(
  serviceName: string,
  method: string,
  options: UseServiceOptions = {}
) {
  const { config } = useStellar();
  const [state, setState] = useState<UseServiceState<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<ServiceResponse<T>> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const service = config.services[serviceName];
        if (!service) {
          throw new Error(`Service "${serviceName}" not found`);
        }

        if (typeof service[method] !== 'function') {
          throw new Error(`Method "${method}" not found in service "${serviceName}"`);
        }

        const result = await service[method](...args);

        setState((prev) => ({ ...prev, data: result.data, loading: false }));

        options.onSuccess?.(result.data);

        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setState((prev) => ({ ...prev, error: errorObj, loading: false }));

        options.onError?.(errorObj);

        throw errorObj;
      }
    },
    [serviceName, method, config.services, options]
  );

  // Handle immediate execution if specified
  useState(() => {
    if (options.immediate) {
      execute();
    }
  });

  return {
    ...state,
    execute,
    // Reset state
    reset: useCallback(() => {
      setState({
        data: null,
        error: null,
        loading: false,
      });
    }, []),
  };
}

// Example usage of auth service hook
export function useAuth() {
  const login = useService('auth', 'login');
  const register = useService('auth', 'register');

  return {
    login: login.execute,
    register: register.execute,
    isLoading: login.loading || register.loading,
    error: login.error || register.error,
  };
}
