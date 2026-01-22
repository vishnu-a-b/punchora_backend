"use strict";
/**
 * Security Validation Utilities
 * Phase 5 Day 10: Input validation and sanitization
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateRangeValidator = exports.FileValidator = exports.PaginationValidator = exports.ObjectIdValidator = exports.StringSanitizer = exports.TimestampValidator = exports.GPSValidator = void 0;
const validator_1 = __importDefault(require("validator"));
/**
 * GPS Coordinate Validation
 */
class GPSValidator {
    /**
     * Validate latitude value
     * Must be between -90 and 90
     */
    static isValidLatitude(lat) {
        return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
    }
    /**
     * Validate longitude value
     * Must be between -180 and 180
     */
    static isValidLongitude(lng) {
        return typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;
    }
    /**
     * Validate GPS accuracy value
     * Must be positive number, typically 0-100 meters
     */
    static isValidAccuracy(accuracy) {
        return typeof accuracy === 'number' && !isNaN(accuracy) && accuracy >= 0 && accuracy <= 10000;
    }
    /**
     * Validate complete GPS location object
     */
    static isValidLocation(location) {
        var _a, _b;
        const lat = (_a = location.latitude) !== null && _a !== void 0 ? _a : location.lat;
        const lng = (_b = location.longitude) !== null && _b !== void 0 ? _b : location.lng;
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
    static detectSpoofingPatterns(location) {
        var _a, _b;
        const reasons = [];
        // Explicit mocked flag
        if (location.mocked === true) {
            reasons.push('Explicitly marked as mocked');
        }
        const lat = (_a = location.latitude) !== null && _a !== void 0 ? _a : location.lat;
        const lng = (_b = location.longitude) !== null && _b !== void 0 ? _b : location.lng;
        if (lat === undefined || lng === undefined) {
            return { spoofed: false, reasons };
        }
        // Exact (0, 0) coordinates (Null Island)
        if (lat === 0 && lng === 0) {
            reasons.push('Coordinates are exactly (0, 0) - likely default/invalid');
        }
        // Very high precision (exactly same coordinates repeatedly can indicate spoofing)
        const decimalPlaces = (num) => {
            const match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
            if (!match)
                return 0;
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
exports.GPSValidator = GPSValidator;
/**
 * Timestamp Validation
 */
class TimestampValidator {
    /**
     * Validate timestamp is within acceptable range
     * Prevents backdated or future-dated submissions
     */
    static isValidTimestamp(timestamp, options = {}) {
        const { maxPastHours = 72, // Default: 72 hours in the past
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
exports.TimestampValidator = TimestampValidator;
/**
 * String Input Sanitization
 */
class StringSanitizer {
    /**
     * Sanitize string input to prevent XSS
     */
    static sanitizeString(input, maxLength = 1000) {
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
        sanitized = validator_1.default.escape(sanitized);
        return sanitized;
    }
    /**
     * Validate and sanitize email
     */
    static isValidEmail(email) {
        if (!email || typeof email !== 'string') {
            return { valid: false, error: 'Email is required' };
        }
        const sanitized = validator_1.default.normalizeEmail(email, {
            gmail_remove_dots: false,
            gmail_remove_subaddress: false
        });
        if (!sanitized || !validator_1.default.isEmail(sanitized)) {
            return { valid: false, error: 'Invalid email format' };
        }
        return { valid: true, sanitized };
    }
    /**
     * Validate phone number format
     */
    static isValidPhone(phone) {
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
exports.StringSanitizer = StringSanitizer;
/**
 * MongoDB ObjectId Validation
 */
class ObjectIdValidator {
    /**
     * Validate MongoDB ObjectId format
     */
    static isValidObjectId(id) {
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
    static isValidObjectIdArray(ids) {
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
exports.ObjectIdValidator = ObjectIdValidator;
/**
 * Pagination Parameter Validation
 */
class PaginationValidator {
    /**
     * Validate and sanitize pagination parameters
     */
    static validatePagination(params) {
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
exports.PaginationValidator = PaginationValidator;
/**
 * File Upload Validation
 */
class FileValidator {
    /**
     * Validate image file type
     */
    static isValidImageType(mimetype) {
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
    static isValidFileSize(size, maxSizeMB = 10) {
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
exports.FileValidator = FileValidator;
/**
 * Date Range Validation
 */
class DateRangeValidator {
    /**
     * Validate date range for reports
     */
    static isValidDateRange(startDate, endDate, maxDays = 365) {
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
exports.DateRangeValidator = DateRangeValidator;
