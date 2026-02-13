"use strict";
/**
 * IP Whitelist Middleware
 * Restricts access to whitelisted IP addresses
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientIP = exports.strictIpWhitelist = exports.ipWhitelist = void 0;
const AuditService_1 = __importDefault(require("../modules/audit/services/AuditService"));
// IP whitelist - should be configured via environment variables
const getWhitelistedIPs = () => {
    const ipString = process.env.IP_WHITELIST || '';
    if (!ipString)
        return [];
    return ipString.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
};
// CIDR range checking helper
const isIPInRange = (ip, range) => {
    // Simple implementation - for production, use a library like 'ipaddr.js'
    if (!range.includes('/')) {
        return ip === range;
    }
    // Basic CIDR matching (simplified - for production use proper library)
    const [rangeIP, bits] = range.split('/');
    const ipParts = ip.split('.').map(Number);
    const rangeParts = rangeIP.split('.').map(Number);
    const maskBits = parseInt(bits);
    // Convert to 32-bit integers
    const ipInt = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
    const rangeInt = (rangeParts[0] << 24) + (rangeParts[1] << 16) + (rangeParts[2] << 8) + rangeParts[3];
    const mask = ~((1 << (32 - maskBits)) - 1);
    return (ipInt & mask) === (rangeInt & mask);
};
/**
 * Extract client IP address from request
 * Handles proxies and load balancers
 */
const getClientIP = (req) => {
    // Check X-Forwarded-For header (most common with proxies)
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
        const ips = xForwardedFor.split(',');
        return ips[0].trim();
    }
    // Check X-Real-IP header
    const xRealIP = req.headers['x-real-ip'];
    if (xRealIP) {
        return xRealIP;
    }
    // Fall back to socket IP
    return req.socket.remoteAddress || req.ip || 'unknown';
};
exports.getClientIP = getClientIP;
/**
 * Check if user is super admin (bypass IP whitelist)
 */
const isSuperAdmin = (req) => {
    const user = req.user;
    return user && (user.role === 'super_admin' || user.isSuperAdmin === true);
};
/**
 * IP whitelist middleware
 */
const ipWhitelist = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Skip if IP whitelist is disabled
        if (process.env.ENABLE_IP_WHITELIST !== 'true') {
            return next();
        }
        const clientIP = getClientIP(req);
        const whitelistedIPs = getWhitelistedIPs();
        // If no whitelist configured, allow all
        if (whitelistedIPs.length === 0) {
            return next();
        }
        // Super admins bypass IP whitelist
        if (isSuperAdmin(req)) {
            return next();
        }
        // Check if IP is whitelisted
        const isWhitelisted = whitelistedIPs.some(range => isIPInRange(clientIP, range));
        if (!isWhitelisted) {
            // Log blocked attempt to audit
            try {
                const auditService = new AuditService_1.default();
                const user = req.user;
                yield auditService.createAuditLog({
                    action: 'IP_BLOCKED',
                    performedBy: ((_a = user === null || user === void 0 ? void 0 : user._id) === null || _a === void 0 ? void 0 : _a.toString()) || 'anonymous',
                    targetModel: 'Security',
                    targetId: 'ip-whitelist',
                    metadata: {
                        blockedIP: clientIP,
                        endpoint: req.path,
                        method: req.method,
                        userAgent: req.headers['user-agent']
                    }
                });
            }
            catch (auditError) {
                console.error('Failed to log IP block:', auditError);
            }
            res.status(403).json({
                error: 'Access forbidden',
                message: 'Your IP address is not authorized to access this resource'
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('IP whitelist error:', error);
        // On error, fail securely by denying access
        res.status(500).json({
            error: 'Security check failed',
            message: 'Failed to validate IP address'
        });
    }
});
exports.ipWhitelist = ipWhitelist;
/**
 * Strict IP whitelist for sensitive endpoints
 * Does not allow super admin bypass
 */
const strictIpWhitelist = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clientIP = getClientIP(req);
        const whitelistedIPs = getWhitelistedIPs();
        // Require whitelist configuration for strict mode
        if (whitelistedIPs.length === 0) {
            res.status(403).json({
                error: 'Access forbidden',
                message: 'IP whitelist not configured for this endpoint'
            });
            return;
        }
        const isWhitelisted = whitelistedIPs.some(range => isIPInRange(clientIP, range));
        if (!isWhitelisted) {
            res.status(403).json({
                error: 'Access forbidden',
                message: 'Your IP address is not authorized'
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Strict IP whitelist error:', error);
        res.status(500).json({
            error: 'Security check failed',
            message: 'Failed to validate IP address'
        });
    }
});
exports.strictIpWhitelist = strictIpWhitelist;
