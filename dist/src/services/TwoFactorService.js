"use strict";
/**
 * Two-Factor Authentication Service
 * Implements TOTP-based 2FA using Google Authenticator compatible tokens
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
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const User_1 = require("../modules/user/models/User");
const AuditService_1 = __importDefault(require("../modules/audit/services/AuditService"));
class TwoFactorService {
    constructor() {
        this.auditService = new AuditService_1.default();
    }
    /**
     * Generate 2FA secret and QR code for user setup
     */
    generateSecret(userId, userEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Generate secret
                const secret = speakeasy_1.default.generateSecret({
                    name: `HRMS (${userEmail})`,
                    issuer: 'HR Management System',
                    length: 32
                });
                // Generate QR code
                const qrCodeUrl = yield qrcode_1.default.toDataURL(secret.otpauth_url);
                return {
                    secret: secret.base32,
                    qrCodeUrl,
                    manualEntryKey: secret.base32
                };
            }
            catch (error) {
                throw new Error(`Failed to generate 2FA secret: ${error.message}`);
            }
        });
    }
    /**
     * Verify TOTP token
     */
    verifyToken(secret, token) {
        try {
            return speakeasy_1.default.totp.verify({
                secret,
                encoding: 'base32',
                token,
                window: 2 // Allow 2 time steps before and after for clock skew
            });
        }
        catch (error) {
            console.error('2FA verification error:', error);
            return false;
        }
    }
    /**
     * Enable 2FA for a user
     */
    enable2FA(userId, secret, verificationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Verify the token before enabling
                if (!this.verifyToken(secret, verificationToken)) {
                    throw new Error('Invalid verification token');
                }
                // Update user with 2FA secret
                yield User_1.User.findByIdAndUpdate(userId, {
                    twoFactorEnabled: true,
                    twoFactorSecret: secret
                });
                // Log to audit
                yield this.auditService.createAuditLog({
                    action: 'TWO_FACTOR_ENABLED',
                    performedBy: userId,
                    targetModel: 'User',
                    targetId: userId,
                    metadata: {
                        timestamp: new Date()
                    }
                });
                return true;
            }
            catch (error) {
                throw new Error(`Failed to enable 2FA: ${error.message}`);
            }
        });
    }
    /**
     * Disable 2FA for a user
     */
    disable2FA(userId, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // In production, verify password before disabling
                // For now, just disable it
                yield User_1.User.findByIdAndUpdate(userId, {
                    twoFactorEnabled: false,
                    twoFactorSecret: null
                });
                // Log to audit
                yield this.auditService.createAuditLog({
                    action: 'TWO_FACTOR_DISABLED',
                    performedBy: userId,
                    targetModel: 'User',
                    targetId: userId,
                    metadata: {
                        timestamp: new Date()
                    }
                });
                return true;
            }
            catch (error) {
                throw new Error(`Failed to disable 2FA: ${error.message}`);
            }
        });
    }
    /**
     * Verify user login with 2FA
     */
    verifyLogin(userId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield User_1.User.findById(userId);
                if (!user) {
                    throw new Error('User not found');
                }
                if (!user.twoFactorEnabled) {
                    throw new Error('2FA is not enabled for this user');
                }
                const isValid = this.verifyToken(user.twoFactorSecret, token);
                if (!isValid) {
                    // Log failed attempt
                    yield this.auditService.createAuditLog({
                        action: 'TWO_FACTOR_FAILED',
                        performedBy: userId,
                        targetModel: 'User',
                        targetId: userId,
                        metadata: {
                            timestamp: new Date(),
                            reason: 'Invalid token'
                        }
                    });
                }
                return isValid;
            }
            catch (error) {
                console.error('2FA login verification error:', error);
                return false;
            }
        });
    }
    /**
     * Generate backup codes for account recovery
     */
    generateBackupCodes(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const codes = [];
            for (let i = 0; i < 10; i++) {
                // Generate random 8-character codes
                const code = Math.random().toString(36).substring(2, 10).toUpperCase();
                codes.push(code);
            }
            // In production, hash and store these codes
            // For now, just return them
            yield this.auditService.createAuditLog({
                action: 'BACKUP_CODES_GENERATED',
                performedBy: userId,
                targetModel: 'User',
                targetId: userId,
                metadata: {
                    codeCount: codes.length,
                    timestamp: new Date()
                }
            });
            return codes;
        });
    }
    /**
     * Check if user has 2FA enabled
     */
    is2FAEnabled(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield User_1.User.findById(userId);
                return (user === null || user === void 0 ? void 0 : user.twoFactorEnabled) === true;
            }
            catch (error) {
                return false;
            }
        });
    }
}
exports.default = TwoFactorService;
