"use strict";
/**
 * API Key Authentication Middleware
 * Validates API keys for programmatic access
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
exports.requirePermission = exports.requireApiKey = exports.validateApiKey = void 0;
const ApiKey_1 = require("../models/ApiKey");
const AuditService_1 = __importDefault(require("../modules/audit/services/AuditService"));
/**
 * Middleware to validate API key from request header
 */
const validateApiKey = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const apiKeyValue = req.headers['x-api-key'];
        if (!apiKeyValue) {
            // No API key provided, continue to next middleware (might use JWT auth)
            return next();
        }
        // Find API key in database
        const apiKey = yield ApiKey_1.ApiKey.findOne({
            key: apiKeyValue,
            active: true
        }).populate('business');
        if (!apiKey) {
            res.status(401).json({
                error: 'Invalid API key',
                message: 'The provided API key is invalid or has been revoked'
            });
            return;
        }
        // Check if expired
        if (apiKey.isExpired()) {
            res.status(401).json({
                error: 'API key expired',
                message: 'The provided API key has expired'
            });
            return;
        }
        // Update last used timestamp (async, don't wait)
        ApiKey_1.ApiKey.updateOne({ _id: apiKey._id }, { $set: { lastUsed: new Date() } }).exec().catch(err => console.error('Failed to update API key lastUsed:', err));
        // Log API key usage to audit trail
        try {
            const auditService = new AuditService_1.default();
            yield auditService.createAuditLog({
                action: 'API_KEY_USED',
                performedBy: apiKey.createdBy.toString(),
                targetModel: 'ApiKey',
                targetId: apiKey._id.toString(),
                business: apiKey.business._id.toString(),
                metadata: {
                    apiKeyName: apiKey.name,
                    endpoint: req.path,
                    method: req.method
                }
            });
        }
        catch (auditError) {
            console.error('Failed to log API key usage:', auditError);
        }
        // Attach API key to request for downstream use
        req.apiKey = apiKey;
        next();
    }
    catch (error) {
        console.error('API key validation error:', error);
        res.status(500).json({
            error: 'Authentication error',
            message: 'Failed to validate API key'
        });
    }
});
exports.validateApiKey = validateApiKey;
/**
 * Middleware to require API key for specific routes
 */
const requireApiKey = (req, res, next) => {
    if (!req.apiKey) {
        res.status(401).json({
            error: 'API key required',
            message: 'This endpoint requires a valid API key'
        });
        return;
    }
    next();
};
exports.requireApiKey = requireApiKey;
/**
 * Middleware to check if API key has specific permission
 */
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.apiKey) {
            res.status(401).json({
                error: 'API key required',
                message: 'This endpoint requires a valid API key'
            });
            return;
        }
        if (!req.apiKey.hasPermission(permission)) {
            res.status(403).json({
                error: 'Insufficient permissions',
                message: `This API key does not have the required permission: ${permission}`
            });
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
