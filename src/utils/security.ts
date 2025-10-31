import crypto from 'crypto';
import { Request } from 'express';

/**
 * Encryption and Security Utilities
 */

/**
 * Generate a secure random string
 */
export const generateRandomString = (length = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a secure random token (URL-safe base64)
 */
export const generateSecureToken = (length = 32): string => {
  return crypto.randomBytes(length).toString('base64url');
};

/**
 * Generate API key
 */
export const generateApiKey = (prefix = 'sk'): string => {
  const randomPart = generateRandomString(24);
  return `${prefix}_${randomPart}`;
};

/**
 * Hash a value using SHA-256
 */
export const hashSHA256 = (value: string): string => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

/**
 * Hash a value using SHA-512
 */
export const hashSHA512 = (value: string): string => {
  return crypto.createHash('sha512').update(value).digest('hex');
};

/**
 * Generate HMAC signature
 */
export const generateHMAC = (data: string, secret: string, algorithm = 'sha256'): string => {
  return crypto.createHmac(algorithm, secret).update(data).digest('hex');
};

/**
 * Verify HMAC signature
 */
export const verifyHMAC = (
  data: string,
  secret: string,
  signature: string,
  algorithm = 'sha256'
): boolean => {
  const expected = generateHMAC(data, secret, algorithm);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

/**
 * Encrypt data using AES-256-GCM
 */
export const encrypt = (
  data: string,
  key: string
): { encrypted: string; iv: string; tag: string } => {
  // Ensure key is 32 bytes for AES-256
  const keyBuffer = crypto.scryptSync(key, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
};

/**
 * Decrypt data using AES-256-GCM
 */
export const decrypt = (encrypted: string, key: string, iv: string, tag: string): string => {
  const keyBuffer = crypto.scryptSync(key, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, Buffer.from(iv, 'hex'));

  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Generate CSRF token
 */
export const generateCSRFToken = (): string => {
  return generateSecureToken(32);
};

/**
 * Verify CSRF token
 */
export const verifyCSRFToken = (token: string, expected: string): boolean => {
  if (!token || !expected) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
};

/**
 * Generate a secure session ID
 */
export const generateSessionId = (): string => {
  return generateSecureToken(48);
};

/**
 * Mask sensitive data (for logging)
 */
export const maskSensitiveData = (data: string, visibleChars = 4): string => {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }
  return data.slice(0, visibleChars) + '*'.repeat(data.length - visibleChars);
};

/**
 * Mask email address
 */
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain) return maskSensitiveData(email);

  const visibleLocal = Math.min(3, Math.floor(local.length / 2));
  const maskedLocal = local.slice(0, visibleLocal) + '*'.repeat(local.length - visibleLocal);

  return `${maskedLocal}@${domain}`;
};

/**
 * Mask credit card number
 */
export const maskCreditCard = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 4) return '*'.repeat(cleaned.length);
  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
};

/**
 * Password strength checker
 */
export interface PasswordStrength {
  score: number; // 0-4
  strength: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
  suggestions: string[];
}

export const checkPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const suggestions: string[] = [];

  // Length check
  if (password.length >= 8) score++;
  else suggestions.push('Use at least 8 characters');

  if (password.length >= 12) score++;

  // Complexity checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    suggestions.push('Include both uppercase and lowercase letters');
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    suggestions.push('Include at least one number');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    suggestions.push('Include at least one special character');
  }

  // Common patterns check
  const commonPatterns = ['password', '123456', 'qwerty', 'abc123', 'letmein'];
  if (commonPatterns.some((pattern) => password.toLowerCase().includes(pattern))) {
    score = Math.max(0, score - 2);
    suggestions.push('Avoid common patterns and dictionary words');
  }

  // Normalize score to 0-4 range
  score = Math.min(4, Math.max(0, Math.floor(score)));

  const strengthMap: PasswordStrength['strength'][] = [
    'very-weak',
    'weak',
    'fair',
    'strong',
    'very-strong',
  ];

  return {
    score,
    strength: strengthMap[score],
    suggestions,
  };
};

/**
 * Generate a secure nonce for CSP
 */
export const generateNonce = (): string => {
  return crypto.randomBytes(16).toString('base64');
};

/**
 * Create fingerprint from request
 */
export const createRequestFingerprint = (req: Request): string => {
  const components = [
    req.ip || 'unknown',
    req.headers['user-agent'] || 'unknown',
    req.headers['accept-language'] || 'unknown',
    req.headers['accept-encoding'] || 'unknown',
  ];

  return hashSHA256(components.join('|'));
};

/**
 * Constant-time string comparison to prevent timing attacks
 */
export const constantTimeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

/**
 * Generate a secure OTP (One-Time Password)
 */
export const generateOTP = (length = 6): string => {
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % digits.length];
  }

  return otp;
};

/**
 * Generate a JWT-compatible secret
 */
export const generateJWTSecret = (length = 64): string => {
  return generateRandomString(length);
};

/**
 * Obfuscate IDs (e.g., for URLs)
 */
export const obfuscateId = (id: number | string, salt: string): string => {
  const data = `${id}-${salt}`;
  return Buffer.from(data).toString('base64url');
};

/**
 * Deobfuscate IDs
 */
export const deobfuscateId = (obfuscated: string, salt: string): string | null => {
  try {
    const decoded = Buffer.from(obfuscated, 'base64url').toString('utf8');
    const [id, providedSalt] = decoded.split('-');

    if (providedSalt !== salt) return null;
    return id;
  } catch {
    return null;
  }
};

/**
 * Rate limit token bucket implementation
 */
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
    private initialTokens: number = capacity
  ) {
    this.tokens = initialTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume tokens
   */
  consume(tokens = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Get current token count
   */
  getTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /**
   * Reset the bucket
   */
  reset(): void {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }
}

/**
 * Secure random number generator
 */
export const randomInt = (min: number, max: number): number => {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const randomBytes = crypto.randomBytes(bytesNeeded);
  const randomValue = randomBytes.readUIntBE(0, bytesNeeded);

  return min + (randomValue % range);
};

/**
 * Generate a UUID v4
 */
export const generateUUID = (): string => {
  return crypto.randomUUID();
};

/**
 * Sign data with timestamp for expiring tokens
 */
export const signWithExpiry = (data: string, secret: string, expiryMs: number): string => {
  const timestamp = Date.now() + expiryMs;
  const payload = `${data}:${timestamp}`;
  const signature = generateHMAC(payload, secret);

  return Buffer.from(`${payload}:${signature}`).toString('base64url');
};

/**
 * Verify signed data with expiry
 */
export const verifyWithExpiry = (
  token: string,
  secret: string
): { valid: boolean; data?: string; expired?: boolean } => {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');

    if (parts.length !== 3) {
      return { valid: false };
    }

    const [data, timestamp, signature] = parts;
    const payload = `${data}:${timestamp}`;

    // Verify signature
    if (!verifyHMAC(payload, secret, signature)) {
      return { valid: false };
    }

    // Check expiry
    const expiryTime = parseInt(timestamp, 10);
    if (Date.now() > expiryTime) {
      return { valid: false, expired: true };
    }

    return { valid: true, data };
  } catch {
    return { valid: false };
  }
};

/**
 * Security headers helper
 */
export const securityHeaders = {
  /**
   * Content Security Policy
   */
  csp: (directives: Record<string, string[]>): string => {
    return Object.entries(directives)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ');
  },

  /**
   * Permissions Policy
   */
  permissionsPolicy: (policies: Record<string, string[]>): string => {
    return Object.entries(policies)
      .map(([feature, origins]) => `${feature}=(${origins.join(' ')})`)
      .join(', ');
  },
};
