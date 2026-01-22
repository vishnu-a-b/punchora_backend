/**
 * Security Validation Utilities
 * Phase 5 Day 10: Input validation and sanitization
 */

import validator from 'validator';

/**
 * GPS Coordinate Validation
 */
export class GPSValidator {
  /**
   * Validate latitude value
   * Must be between -90 and 90
   */
  static isValidLatitude(lat: number): boolean {
    return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
  }

  /**
   * Validate longitude value
   * Must be between -180 and 180
   */
  static isValidLongitude(lng: number): boolean {
    return typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;
  }

  /**
   * Validate GPS accuracy value
   * Must be positive number, typically 0-100 meters
   */
  static isValidAccuracy(accuracy: number): boolean {
    return typeof accuracy === 'number' && !isNaN(accuracy) && accuracy >= 0 && accuracy <= 10000;
  }

  /**
   * Validate complete GPS location object
   */
  static isValidLocation(location: {
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
    accuracy?: number;
  }): { valid: boolean; error?: string } {
    const lat = location.latitude ?? location.lat;
    const lng = location.longitude ?? location.lng;

    if (lat === undefined || lng === undefined) {
      return { valid: false, error: 'Missing latitude or longitude' };
    }

    if (!this.isValidLatitude(lat)) {
      return { valid: false, error: `Invalid latitude: ${lat}. Must be between -90 and 90` };
    }

    if (!this.isValidLongitude(lng)) {
      return { valid: false, error: `Invalid longitude: ${lng}. Must be between -180 and 180` };
    }

    if (location.accuracy !== undefined && !this.isValidAccuracy(location.accuracy)) {
      return { valid: false, error: `Invalid accuracy: ${location.accuracy}. Must be between 0 and 10000` };
    }

    return { valid: true };
  }

  /**
   * Detect potentially spoofed GPS coordinates
   * Checks for common spoofing patterns
   */
  static detectSpoofingPatterns(location: {
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
    accuracy?: number;
    mocked?: boolean;
  }): { spoofed: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Explicit mocked flag
    if (location.mocked === true) {
      reasons.push('Explicitly marked as mocked');
    }

    const lat = location.latitude ?? location.lat;
    const lng = location.longitude ?? location.lng;

    if (lat === undefined || lng === undefined) {
      return { spoofed: false, reasons };
    }

    // Exact (0, 0) coordinates (Null Island)
    if (lat === 0 && lng === 0) {
      reasons.push('Coordinates are exactly (0, 0) - likely default/invalid');
    }

    // Very high precision (exactly same coordinates repeatedly can indicate spoofing)
    const decimalPlaces = (num: number): number => {
      const match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
      if (!match) return 0;
      return Math.max(0, (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0));
    };

    // More than 8 decimal places is suspicious (GPS doesn't provide that precision)
    if (decimalPlaces(lat) > 8 || decimalPlaces(lng) > 8) {
      reasons.push('Unrealistic GPS precision (> 8 decimal places)');
    }

    // Suspiciously perfect accuracy (< 1 meter)
    if (location.accuracy !== undefined && location.accuracy < 1) {
      reasons.push('Unrealistic accuracy (< 1 meter) - GPS rarely this precise');
    }

    // Perfect round numbers
    if (Number.isInteger(lat) && Number.isInteger(lng)) {
      reasons.push('Perfect integer coordinates - suspicious');
    }

    return {
      spoofed: reasons.length > 0,
      reasons
    };
  }
}

/**
 * Timestamp Validation
 */
export class TimestampValidator {
  /**
   * Validate timestamp is within acceptable range
   * Prevents backdated or future-dated submissions
   */
  static isValidTimestamp(timestamp: number, options: {
    maxPastHours?: number;
    maxFutureMinutes?: number;
  } = {}): { valid: boolean; error?: string } {
    const {
      maxPastHours = 72, // Default: 72 hours in the past
      maxFutureMinutes = 5 // Default: 5 minutes in the future
    } = options;

    if (!Number.isInteger(timestamp) || timestamp <= 0) {
      return { valid: false, error: 'Timestamp must be a positive integer' };
    }

    const now = Date.now();
    const maxPastMs = maxPastHours * 60 * 60 * 1000;
    const maxFutureMs = maxFutureMinutes * 60 * 1000;

    if (timestamp < now - maxPastMs) {
      return {
        valid: false,
        error: `Timestamp too old. Maximum ${maxPastHours} hours in the past allowed`
      };
    }

    if (timestamp > now + maxFutureMs) {
      return {
        valid: false,
        error: `Timestamp in the future. Maximum ${maxFutureMinutes} minutes ahead allowed`
      };
    }

    return { valid: true };
  }
}

/**
 * String Input Sanitization
 */
export class StringSanitizer {
  /**
   * Sanitize string input to prevent XSS
   */
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Trim whitespace
    let sanitized = input.trim();

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Escape HTML special characters
    sanitized = validator.escape(sanitized);

    return sanitized;
  }

  /**
   * Validate and sanitize email
   */
  static isValidEmail(email: string): { valid: boolean; sanitized?: string; error?: string } {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required' };
    }

    const sanitized = validator.normalizeEmail(email, {
      gmail_remove_dots: false,
      gmail_remove_subaddress: false
    });

    if (!sanitized || !validator.isEmail(sanitized)) {
      return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true, sanitized };
  }

  /**
   * Validate phone number format
   */
  static isValidPhone(phone: string): { valid: boolean; error?: string } {
    if (!phone || typeof phone !== 'string') {
      return { valid: false, error: 'Phone number is required' };
    }

    // Remove spaces, dashes, parentheses
    const cleaned = phone.replace(/[\s\-()]/g, '');

    // Must be 10-15 digits
    if (!/^\d{10,15}$/.test(cleaned)) {
      return { valid: false, error: 'Phone must be 10-15 digits' };
    }

    return { valid: true };
  }
}

/**
 * MongoDB ObjectId Validation
 */
export class ObjectIdValidator {
  /**
   * Validate MongoDB ObjectId format
   */
  static isValidObjectId(id: string): { valid: boolean; error?: string } {
    if (!id || typeof id !== 'string') {
      return { valid: false, error: 'ID is required' };
    }

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return { valid: false, error: 'Invalid ObjectId format' };
    }

    return { valid: true };
  }

  /**
   * Validate array of ObjectIds
   */
  static isValidObjectIdArray(ids: string[]): { valid: boolean; error?: string } {
    if (!Array.isArray(ids)) {
      return { valid: false, error: 'IDs must be an array' };
    }

    if (ids.length === 0) {
      return { valid: false, error: 'IDs array cannot be empty' };
    }

    for (const id of ids) {
      const validation = this.isValidObjectId(id);
      if (!validation.valid) {
        return { valid: false, error: `Invalid ID in array: ${id}` };
      }
    }

    return { valid: true };
  }
}

/**
 * Pagination Parameter Validation
 */
export class PaginationValidator {
  /**
   * Validate and sanitize pagination parameters
   */
  static validatePagination(params: {
    page?: number | string;
    limit?: number | string;
    skip?: number | string;
  }): {
    page: number;
    limit: number;
    skip: number;
  } {
    const DEFAULT_PAGE = 1;
    const DEFAULT_LIMIT = 10;
    const MAX_LIMIT = 100;

    let page = parseInt(String(params.page || DEFAULT_PAGE));
    let limit = parseInt(String(params.limit || DEFAULT_LIMIT));
    let skip = parseInt(String(params.skip || 0));

    // Validate page
    if (isNaN(page) || page < 1) {
      page = DEFAULT_PAGE;
    }

    // Validate limit
    if (isNaN(limit) || limit < 1) {
      limit = DEFAULT_LIMIT;
    }
    if (limit > MAX_LIMIT) {
      limit = MAX_LIMIT;
    }

    // Validate skip
    if (isNaN(skip) || skip < 0) {
      skip = 0;
    }

    return { page, limit, skip };
  }
}

/**
 * File Upload Validation
 */
export class FileValidator {
  /**
   * Validate image file type
   */
  static isValidImageType(mimetype: string): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(mimetype)) {
      return {
        valid: false,
        error: `Invalid file type: ${mimetype}. Allowed: ${allowedTypes.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Validate file size
   */
  static isValidFileSize(size: number, maxSizeMB: number = 10): { valid: boolean; error?: string } {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (size > maxSizeBytes) {
      return {
        valid: false,
        error: `File too large: ${(size / 1024 / 1024).toFixed(2)}MB. Maximum: ${maxSizeMB}MB`
      };
    }

    return { valid: true };
  }
}

/**
 * Date Range Validation
 */
export class DateRangeValidator {
  /**
   * Validate date range for reports
   */
  static isValidDateRange(startDate: Date | string, endDate: Date | string, maxDays: number = 365): {
    valid: boolean;
    error?: string;
    start?: Date;
    end?: Date;
  } {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      return { valid: false, error: 'Invalid start date' };
    }

    if (isNaN(end.getTime())) {
      return { valid: false, error: 'Invalid end date' };
    }

    if (start > end) {
      return { valid: false, error: 'Start date must be before end date' };
    }

    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > maxDays) {
      return { valid: false, error: `Date range too large. Maximum: ${maxDays} days` };
    }

    return { valid: true, start, end };
  }
}
