"use strict";
/**
 * CSRF Protection Middleware
 * Uses double-submit cookie pattern for CSRF protection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.doubleCsrfProtection = exports.generateToken = exports.csrfProtection = exports.generateCsrfToken = void 0;
const csrf_csrf_1 = require("csrf-csrf");
// Initialize CSRF protection
const { generateCsrfToken: generateToken, doubleCsrfProtection, invalidCsrfTokenError } = (0, csrf_csrf_1.doubleCsrf)({
    getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
    getSessionIdentifier: (req) => { var _a, _b, _c; return ((_a = req.session) === null || _a === void 0 ? void 0 : _a.id) || ((_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString()) || 'anonymous'; },
    cookieName: '__Host-csrf',
    cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    getCsrfTokenFromRequest: (req) => {
        var _a, _b;
        // Check multiple sources for CSRF token
        return req.headers['x-csrf-token'] ||
            ((_a = req.body) === null || _a === void 0 ? void 0 : _a._csrf) ||
            ((_b = req.query) === null || _b === void 0 ? void 0 : _b._csrf);
    }
});
exports.generateToken = generateToken;
exports.doubleCsrfProtection = doubleCsrfProtection;
/**
 * CSRF token generation endpoint handler
 */
const generateCsrfToken = (req, res) => {
    try {
        const token = generateToken(req, res);
        res.json({ csrfToken: token });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate CSRF token', message: error.message });
    }
};
exports.generateCsrfToken = generateCsrfToken;
/**
 * Custom CSRF protection middleware with error handling
 * CURRENTLY DISABLED - All requests bypass CSRF protection
 */
const csrfProtection = (req, res, next) => {
    // CSRF PROTECTION DISABLED
    // To re-enable, set ENABLE_CSRF=true in .env
    if (process.env.ENABLE_CSRF !== 'true') {
        return next();
    }
    // ALWAYS skip CSRF for safe methods (GET, HEAD, OPTIONS)
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
        return next();
    }
    // Skip CSRF for authentication endpoints (login, register, refresh)
    const authExemptPaths = [
        '/auth/jwt/create',
        '/auth/login',
        '/auth/register',
        '/auth/refresh',
        '/security/csrf-token',
        '/v1/auth', // All auth endpoints
    ];
    if (authExemptPaths.some(path => req.path.includes(path))) {
        return next();
    }
    // Skip CSRF for mobile app endpoints (use API keys instead)
    if (req.path.startsWith('/api/mobile') || req.path.startsWith('/api/offline')) {
        return next();
    }
    // Skip CSRF if API key is present
    if (req.headers['x-api-key']) {
        return next();
    }
    // Apply CSRF protection
    try {
        doubleCsrfProtection(req, res, (error) => {
            if (error) {
                if (error === invalidCsrfTokenError) {
                    return res.status(403).json({
                        error: 'CSRF token validation failed',
                        message: 'Invalid or missing CSRF token'
                    });
                }
                return res.status(500).json({
                    error: 'CSRF protection error',
                    message: error.message || String(error)
                });
            }
            next();
        });
    }
    catch (error) {
        // Handle synchronous errors
        console.error('[CSRF] Error:', error.message);
        return res.status(500).json({
            error: 'CSRF protection error',
            message: error.message
        });
    }
};
exports.csrfProtection = csrfProtection;
