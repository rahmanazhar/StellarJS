/**
 * Validation utilities for request/response data
 */

export type ValidationRule = {
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'email' | 'url';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
};

export type ValidationSchema = {
  [key: string]: ValidationRule;
};

export type ValidationError = {
  field: string;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};

/**
 * Validate data against a schema
 */
export function validate(data: any, schema: ValidationSchema): ValidationResult {
  const errors: ValidationError[] = [];

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];
    const fieldErrors = validateField(field, value, rule);
    errors.push(...fieldErrors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a single field
 */
function validateField(field: string, value: any, rule: ValidationRule): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    errors.push({
      field,
      message: rule.message || `${field} is required`,
    });
    return errors;
  }

  // Skip other validations if value is not provided and not required
  if (value === undefined || value === null) {
    return errors;
  }

  // Check type
  if (rule.type) {
    const typeError = validateType(field, value, rule.type, rule.message);
    if (typeError) {
      errors.push(typeError);
      return errors;
    }
  }

  // Check min/max for strings and numbers
  if (rule.min !== undefined) {
    if (typeof value === 'string' && value.length < rule.min) {
      errors.push({
        field,
        message: rule.message || `${field} must be at least ${rule.min} characters`,
      });
    } else if (typeof value === 'number' && value < rule.min) {
      errors.push({
        field,
        message: rule.message || `${field} must be at least ${rule.min}`,
      });
    }
  }

  if (rule.max !== undefined) {
    if (typeof value === 'string' && value.length > rule.max) {
      errors.push({
        field,
        message: rule.message || `${field} must be at most ${rule.max} characters`,
      });
    } else if (typeof value === 'number' && value > rule.max) {
      errors.push({
        field,
        message: rule.message || `${field} must be at most ${rule.max}`,
      });
    }
  }

  // Check pattern
  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    errors.push({
      field,
      message: rule.message || `${field} has invalid format`,
    });
  }

  // Custom validation
  if (rule.custom && !rule.custom(value)) {
    errors.push({
      field,
      message: rule.message || `${field} failed custom validation`,
    });
  }

  return errors;
}

/**
 * Validate type
 */
function validateType(
  field: string,
  value: any,
  type: string,
  message?: string
): ValidationError | null {
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return { field, message: message || `${field} must be a string` };
      }
      break;
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return { field, message: message || `${field} must be a number` };
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        return { field, message: message || `${field} must be a boolean` };
      }
      break;
    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return { field, message: message || `${field} must be an object` };
      }
      break;
    case 'array':
      if (!Array.isArray(value)) {
        return { field, message: message || `${field} must be an array` };
      }
      break;
    case 'email':
      if (typeof value !== 'string' || !isValidEmail(value)) {
        return { field, message: message || `${field} must be a valid email` };
      }
      break;
    case 'url':
      if (typeof value !== 'string' || !isValidUrl(value)) {
        return { field, message: message || `${field} must be a valid URL` };
      }
      break;
  }

  return null;
}

/**
 * Check if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize string to prevent XSS
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  email: {
    email: {
      type: 'email' as const,
      required: true,
      message: 'Valid email is required',
    },
  },
  password: {
    password: {
      type: 'string' as const,
      required: true,
      min: 8,
      message: 'Password must be at least 8 characters',
    },
  },
  login: {
    email: {
      type: 'email' as const,
      required: true,
    },
    password: {
      type: 'string' as const,
      required: true,
      min: 8,
    },
  },
  register: {
    email: {
      type: 'email' as const,
      required: true,
    },
    password: {
      type: 'string' as const,
      required: true,
      min: 8,
    },
    name: {
      type: 'string' as const,
      required: true,
      min: 2,
      max: 100,
    },
  },
};

/**
 * Express middleware factory for validation
 */
export function validateRequest(schema: ValidationSchema) {
  return (req: any, res: any, next: any) => {
    const result = validate(req.body, schema);

    if (!result.valid) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: result.errors,
        },
      });
    }

    next();
  };
}

/**
 * Validate nested objects
 */
export function validateNested(data: any, schema: ValidationSchema, prefix = ''): ValidationResult {
  const errors: ValidationError[] = [];

  for (const [field, rule] of Object.entries(schema)) {
    const fullField = prefix ? `${prefix}.${field}` : field;
    const value = data[field];

    if (rule.type === 'object' && typeof value === 'object' && value !== null) {
      // Recursively validate nested objects
      const nestedResult = validateNested(value, schema, fullField);
      errors.push(...nestedResult.errors);
    } else {
      const fieldErrors = validateField(fullField, value, rule);
      errors.push(...fieldErrors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate array of objects
 */
export function validateArray(data: any[], schema: ValidationSchema): ValidationResult {
  const errors: ValidationError[] = [];

  if (!Array.isArray(data)) {
    errors.push({
      field: 'data',
      message: 'Expected an array',
    });
    return { valid: false, errors };
  }

  data.forEach((item, index) => {
    const result = validate(item, schema);
    result.errors.forEach((error) => {
      errors.push({
        field: `[${index}].${error.field}`,
        message: error.message,
      });
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
