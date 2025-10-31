import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import validator from 'validator';
import { createLogger } from '../utils/helpers';

const logger = createLogger('Validation');

/**
 * Validation target - where to validate data from
 */
export type ValidationTarget = 'body' | 'query' | 'params' | 'headers';

/**
 * Validation options
 */
export interface ValidationOptions {
  /**
   * Abort early on first error
   * Default: false
   */
  abortEarly?: boolean;

  /**
   * Strip unknown properties
   * Default: true
   */
  stripUnknown?: boolean;

  /**
   * Allow unknown properties
   * Default: false
   */
  allowUnknown?: boolean;

  /**
   * Custom error messages
   */
  messages?: Record<string, string>;
}

/**
 * Validation error response
 */
export interface ValidationError {
  field: string;
  message: string;
  type: string;
}

/**
 * Create validation middleware using Joi schema
 */
export const validate = (
  schema: Joi.Schema,
  target: ValidationTarget = 'body',
  options: ValidationOptions = {}
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const defaultOptions: Joi.ValidationOptions = {
      abortEarly: options.abortEarly ?? false,
      stripUnknown: options.stripUnknown ?? true,
      allowUnknown: options.allowUnknown ?? false,
    };

    const dataToValidate = req[target];

    const { error, value } = schema.validate(dataToValidate, defaultOptions);

    if (error) {
      const errors: ValidationError[] = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      logger.warn(`Validation failed for ${target}:`, errors);

      res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
        },
      });
      return;
    }

    // Replace the request data with validated (and potentially transformed) data
    req[target] = value;
    next();
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  /**
   * Email validation
   */
  email: Joi.string().email().trim().lowercase().required(),

  /**
   * Strong password validation
   */
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),

  /**
   * UUID validation
   */
  uuid: Joi.string().uuid().required(),

  /**
   * MongoDB ObjectId validation
   */
  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),

  /**
   * URL validation
   */
  url: Joi.string().uri().required(),

  /**
   * Phone number validation (international format)
   */
  phone: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required(),

  /**
   * Pagination parameters
   */
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').default('asc'),
  }),

  /**
   * Date range validation
   */
  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  }),

  /**
   * API key validation
   */
  apiKey: Joi.string().alphanum().min(32).max(64).required(),

  /**
   * Username validation
   */
  username: Joi.string().alphanum().min(3).max(30).required(),

  /**
   * Boolean string to boolean conversion
   */
  booleanString: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid('true', 'false', '1', '0', 'yes', 'no'))
    .custom((value) => {
      if (typeof value === 'string') {
        return ['true', '1', 'yes'].includes(value.toLowerCase());
      }
      return value;
    }),
};

/**
 * Sanitization utilities
 */
export const sanitize = {
  /**
   * Sanitize email
   */
  email: (email: string): string => {
    return validator.normalizeEmail(email) || email;
  },

  /**
   * Sanitize HTML
   */
  html: (html: string): string => {
    return validator.escape(html);
  },

  /**
   * Sanitize and validate URL
   */
  url: (url: string): string | null => {
    const trimmed = validator.trim(url);
    return validator.isURL(trimmed) ? trimmed : null;
  },

  /**
   * Remove non-alphanumeric characters
   */
  alphanumeric: (str: string): string => {
    return str.replace(/[^a-zA-Z0-9]/g, '');
  },

  /**
   * Sanitize filename
   */
  filename: (filename: string): string => {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  },

  /**
   * Sanitize integer
   */
  integer: (value: any): number | null => {
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  },

  /**
   * Sanitize float
   */
  float: (value: any): number | null => {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  },

  /**
   * Trim and normalize whitespace
   */
  text: (text: string): string => {
    return validator.trim(text).replace(/\s+/g, ' ');
  },
};

/**
 * Custom validators
 */
export const validators = {
  /**
   * Validate credit card
   */
  isCreditCard: (value: string): boolean => {
    return validator.isCreditCard(value);
  },

  /**
   * Validate IP address
   */
  isIP: (value: string, version?: 4 | 6): boolean => {
    return validator.isIP(value, version);
  },

  /**
   * Validate MAC address
   */
  isMACAddress: (value: string): boolean => {
    return validator.isMACAddress(value);
  },

  /**
   * Validate hex color
   */
  isHexColor: (value: string): boolean => {
    return validator.isHexColor(value);
  },

  /**
   * Validate JSON string
   */
  isJSON: (value: string): boolean => {
    return validator.isJSON(value);
  },

  /**
   * Validate JWT token
   */
  isJWT: (value: string): boolean => {
    return validator.isJWT(value);
  },

  /**
   * Validate slug
   */
  isSlug: (value: string): boolean => {
    return validator.isSlug(value);
  },

  /**
   * Strong password check
   */
  isStrongPassword: (
    value: string,
    options?: {
      minLength?: number;
      minLowercase?: number;
      minUppercase?: number;
      minNumbers?: number;
      minSymbols?: number;
    }
  ): boolean => {
    return validator.isStrongPassword(value, options);
  },
};

/**
 * File upload validation middleware
 */
export const validateFile = (options: {
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const file = (req as any).file;
    const files = (req as any).files;

    if (options.required && !file && (!files || files.length === 0)) {
      res.status(400).json({
        error: {
          message: 'File is required',
          code: 'FILE_REQUIRED',
        },
      });
      return;
    }

    if (!file && !files) {
      next();
      return;
    }

    const filesToCheck = file ? [file] : files;

    for (const f of filesToCheck) {
      // Check file size
      if (options.maxSize && f.size > options.maxSize) {
        res.status(400).json({
          error: {
            message: `File size exceeds maximum allowed size of ${options.maxSize} bytes`,
            code: 'FILE_TOO_LARGE',
            file: f.originalname,
          },
        });
        return;
      }

      // Check file type
      if (options.allowedTypes && !options.allowedTypes.includes(f.mimetype)) {
        res.status(400).json({
          error: {
            message: `File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`,
            code: 'INVALID_FILE_TYPE',
            file: f.originalname,
            type: f.mimetype,
          },
        });
        return;
      }
    }

    next();
  };
};

/**
 * Create custom Joi extension for additional validation
 */
export const createCustomValidation = (
  name: string,
  validator: (value: any) => boolean,
  message: string
) => {
  return Joi.extend((joi) => ({
    type: name,
    base: joi.string(),
    messages: {
      [`${name}.invalid`]: message,
    },
    validate(value, helpers) {
      if (!validator(value)) {
        return { value, errors: helpers.error(`${name}.invalid`) };
      }
      return { value };
    },
  }));
};

/**
 * Batch validation - validate multiple schemas
 */
export const validateAll = (
  validations: Array<{
    schema: Joi.Schema;
    target: ValidationTarget;
    options?: ValidationOptions;
  }>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: ValidationError[] = [];

    for (const { schema, target, options = {} } of validations) {
      const defaultOptions: Joi.ValidationOptions = {
        abortEarly: false,
        stripUnknown: options.stripUnknown ?? true,
        allowUnknown: options.allowUnknown ?? false,
      };

      const { error, value } = schema.validate(req[target], defaultOptions);

      if (error) {
        errors.push(
          ...error.details.map((detail) => ({
            field: `${target}.${detail.path.join('.')}`,
            message: detail.message,
            type: detail.type,
          }))
        );
      } else {
        req[target] = value;
      }
    }

    if (errors.length > 0) {
      logger.warn('Validation failed:', errors);
      res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
        },
      });
      return;
    }

    next();
  };
};

/**
 * Export Joi for custom schema creation
 */
export { Joi };
