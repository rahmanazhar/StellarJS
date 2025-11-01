export interface TodoServiceConfig {
  // Define your service configuration
  apiUrl?: string;
}

export interface TodoServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Add more type definitions as needed
