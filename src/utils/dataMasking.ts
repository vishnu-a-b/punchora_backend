/**
 * Data Masking Utilities
 * Phase 5 Day 10: Prevent sensitive data leakage in errors and logs
 */

/**
 * Sensitive Field Patterns
 * Regex patterns to detect sensitive fields
 */
const SENSITIVE_PATTERNS = {
  // Authentication
  password: /password|passwd|pwd|secret|token|auth|credential/i,
  // Personal Information
  email: /email|mail/i,
  phone: /phone|mobile|tel|telephone/i,
  // Financial
  card: /card|creditcard|debitcard|cvv|ccv|pan/i,
  bank: /bank|account|routing|swift|iban/i,
  // System
  apiKey: /apikey|api_key|key|secret/i,
  jwt: /jwt|bearer|authorization/i,
  // Location (sometimes sensitive)
  location: /location|gps|latitude|longitude|lat|lng/i
};

/**
 * Data Masking Class
 */
export class DataMasker {
  /**
   * Mask sensitive string data
   */
  static maskString(value: string, visibleChars: number = 4): string {
    if (!value || value.length <= visibleChars) {
      return '*'.repeat(value?.length || 4);
    }

    const masked = '*'.repeat(value.length - visibleChars);
    return masked + value.slice(-visibleChars);
  }

  /**
   * Mask email address
   */
  static maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return '***@***.***';
    }

    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2
      ? username[0] + '*'.repeat(username.length - 2) + username.slice(-1)
      : '*'.repeat(username.length);

    const [domainName, tld] = domain.split('.');
    const maskedDomain = domainName.length > 2
      ? domainName[0] + '*'.repeat(domainName.length - 2) + domainName.slice(-1)
      : '*'.repeat(domainName.length);

    return `${maskedUsername}@${maskedDomain}.${tld}`;
  }

  /**
   * Mask phone number
   */
  static maskPhone(phone: string): string {
    if (!phone || phone.length < 4) {
      return '***-***-****';
    }

    const cleaned = phone.replace(/\D/g, '');
    const visibleDigits = cleaned.slice(-4);
    const maskedDigits = '*'.repeat(Math.max(0, cleaned.length - 4));

    return maskedDigits + visibleDigits;
  }

  /**
   * Mask GPS coordinates
   */
  static maskCoordinates(lat: number, lng: number): { lat: string; lng: string } {
    return {
      lat: lat.toFixed(2) + '°',
      lng: lng.toFixed(2) + '°'
    };
  }

  /**
   * Mask JWT token
   */
  static maskToken(token: string): string {
    if (!token) return '***';

    // Show first 10 and last 10 characters
    if (token.length > 20) {
      return token.slice(0, 10) + '...' + token.slice(-10);
    }

    return this.maskString(token, 4);
  }

  /**
   * Mask ObjectId (show first 4 and last 4 characters)
   */
  static maskObjectId(id: string): string {
    if (!id || id.length < 8) {
      return '***';
    }

    return id.slice(0, 4) + '...' + id.slice(-4);
  }

  /**
   * Detect if a field name is sensitive
   */
  static isSensitiveField(fieldName: string): boolean {
    return Object.values(SENSITIVE_PATTERNS).some(pattern => pattern.test(fieldName));
  }

  /**
   * Mask sensitive fields in an object
   */
  static maskObject(obj: any, options: {
    maskCoordinates?: boolean;
    customPatterns?: RegExp[];
  } = {}): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.maskObject(item, options));
    }

    const masked: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Check if field is sensitive
      const isSensitive = this.isSensitiveField(key) ||
        (options.customPatterns?.some(pattern => pattern.test(key)) ?? false);

      if (isSensitive) {
        // Mask based on field type
        if (typeof value === 'string') {
          if (key.toLowerCase().includes('email')) {
            masked[key] = this.maskEmail(value);
          } else if (key.toLowerCase().includes('phone')) {
            masked[key] = this.maskPhone(value);
          } else if (key.toLowerCase().includes('token') || key.toLowerCase().includes('jwt')) {
            masked[key] = this.maskToken(value);
          } else {
            masked[key] = this.maskString(value);
          }
        } else if (typeof value === 'number') {
          masked[key] = '***';
        } else if (typeof value === 'object') {
          masked[key] = this.maskObject(value, options);
        } else {
          masked[key] = '***';
        }
      } else if (options.maskCoordinates &&
        (key === 'latitude' || key === 'lat') &&
        typeof value === 'number') {
        // Mask coordinates if requested
        masked[key] = value.toFixed(2) + '°';
      } else if (options.maskCoordinates &&
        (key === 'longitude' || key === 'lng') &&
        typeof value === 'number') {
        masked[key] = value.toFixed(2) + '°';
      } else if (typeof value === 'object' && value !== null) {
        // Recursively mask nested objects
        masked[key] = this.maskObject(value, options);
      } else {
        // Keep non-sensitive values
        masked[key] = value;
      }
    }

    return masked;
  }

  /**
   * Mask sensitive data in error messages
   */
  static maskErrorMessage(error: Error | string): string {
    const message = typeof error === 'string' ? error : error.message;

    let masked = message;

    // Mask email addresses
    masked = masked.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, (match) => {
      return this.maskEmail(match);
    });

    // Mask phone numbers (10-15 digits)
    masked = masked.replace(/\b\d{10,15}\b/g, '***-***-****');

    // Mask JWT tokens (Bearer tokens)
    masked = masked.replace(/Bearer\s+[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/gi, 'Bearer ***');

    // Mask MongoDB ObjectIds
    masked = masked.replace(/\b[0-9a-fA-F]{24}\b/g, (match) => {
      return this.maskObjectId(match);
    });

    // Mask common secret patterns
    masked = masked.replace(/secret[:\s]*[^\s,}]+/gi, 'secret: ***');
    masked = masked.replace(/password[:\s]*[^\s,}]+/gi, 'password: ***');
    masked = masked.replace(/token[:\s]*[^\s,}]+/gi, 'token: ***');

    return masked;
  }

  /**
   * Sanitize error response for client
   */
  static sanitizeErrorResponse(error: any, includeStack: boolean = false): {
    error: string;
    message: string;
    stack?: string;
    details?: any;
  } {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Mask the error message
    const maskedMessage = this.maskErrorMessage(error.message || 'An error occurred');

    const response: any = {
      error: error.name || 'Error',
      message: maskedMessage
    };

    // Include stack trace only in development
    if ((includeStack || isDevelopment) && error.stack) {
      response.stack = this.maskErrorMessage(error.stack);
    }

    // Mask any additional error details
    if (error.details) {
      response.details = this.maskObject(error.details);
    }

    return response;
  }

  /**
   * Create safe log message (mask sensitive data)
   */
  static createSafeLogMessage(message: string, data?: any): string {
    let safeMessage = this.maskErrorMessage(message);

    if (data) {
      const maskedData = this.maskObject(data);
      safeMessage += ' | Data: ' + JSON.stringify(maskedData);
    }

    return safeMessage;
  }
}

/**
 * Express Middleware for Error Response Masking
 */
export function errorMaskingMiddleware(err: any, req: any, res: any, next: any) {
  // Log the full error internally (will be masked by logger if configured)
  console.error('[Error]', DataMasker.createSafeLogMessage(err.message, {
    path: req.path,
    method: req.method,
    userId: req.user?.id
  }));

  // Send masked error to client
  const sanitizedError = DataMasker.sanitizeErrorResponse(err);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    ...sanitizedError,
    timestamp: new Date().toISOString()
  });
}

/**
 * Mask database query results before sending to client
 */
export function maskQueryResults<T extends any[]>(results: T, sensitiveFields: string[] = []): T {
  if (!results || !Array.isArray(results)) {
    return results;
  }

  return results.map(result => {
    if (typeof result === 'object' && result !== null) {
      const masked: any = { ...result };

      // Mask default sensitive fields
      if (masked.password) masked.password = '***';
      if (masked.passwordHash) masked.passwordHash = '***';
      if (masked.token) masked.token = DataMasker.maskToken(masked.token);
      if (masked.refreshToken) masked.refreshToken = DataMasker.maskToken(masked.refreshToken);
      if (masked.apiKey) masked.apiKey = DataMasker.maskString(masked.apiKey);

      // Mask custom sensitive fields
      sensitiveFields.forEach(field => {
        if (masked[field]) {
          if (typeof masked[field] === 'string') {
            masked[field] = DataMasker.maskString(masked[field]);
          } else {
            masked[field] = '***';
          }
        }
      });

      return masked;
    }

    return result;
  }) as T;
}
