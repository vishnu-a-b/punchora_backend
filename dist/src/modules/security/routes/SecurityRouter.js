"use strict";
/**
 * Security Routes
 * Endpoints for CSRF tokens and 2FA management
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
const express_1 = require("express");
const csrfProtection_1 = require("../../../middlewares/csrfProtection");
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const TwoFactorService_1 = __importDefault(require("../../../services/TwoFactorService"));
const User_1 = require("../../user/models/User");
const router = (0, express_1.Router)();
const twoFactorService = new TwoFactorService_1.default();
/**
 * @route   GET /v1/security/csrf-token
 * @desc    Get CSRF token
 * @access  Public
 */
router.get('/csrf-token', csrfProtection_1.generateCsrfToken);
// All 2FA routes require authentication
router.use(authenticateUser_1.authenticateUser);
/**
 * @route   POST /v1/security/2fa/setup
 * @desc    Generate 2FA secret and QR code
 * @access  Private
 */
router.post('/2fa/setup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        // Get user email
        const userDoc = yield User_1.User.findById(user._id);
        if (!userDoc) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Generate secret and QR code
        const setupData = yield twoFactorService.generateSecret(user._id.toString(), userDoc.email || userDoc.mobileNo);
        res.json({
            success: true,
            secret: setupData.secret,
            qrCode: setupData.qrCodeUrl,
            manualEntryKey: setupData.manualEntryKey,
            message: 'Scan the QR code with Google Authenticator or enter the manual key'
        });
    }
    catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({
            error: 'Failed to setup 2FA',
            message: error.message
        });
    }
}));
/**
 * @route   POST /v1/security/2fa/enable
 * @desc    Enable 2FA after verification
 * @access  Private
 */
router.post('/2fa/enable', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { secret, token } = req.body;
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!secret || !token) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'secret and token are required'
            });
        }
        // Enable 2FA
        const enabled = yield twoFactorService.enable2FA(user._id.toString(), secret, token);
        if (!enabled) {
            return res.status(400).json({
                error: '2FA enable failed',
                message: 'Invalid verification token'
            });
        }
        res.json({
            success: true,
            message: '2FA enabled successfully'
        });
    }
    catch (error) {
        console.error('2FA enable error:', error);
        res.status(400).json({
            error: 'Failed to enable 2FA',
            message: error.message
        });
    }
}));
/**
 * @route   POST /v1/security/2fa/disable
 * @desc    Disable 2FA
 * @access  Private
 */
router.post('/2fa/disable', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { password } = req.body;
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        // In production, verify password before disabling
        // For now, just disable it
        const disabled = yield twoFactorService.disable2FA(user._id.toString(), password || '');
        res.json({
            success: true,
            message: '2FA disabled successfully'
        });
    }
    catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({
            error: 'Failed to disable 2FA',
            message: error.message
        });
    }
}));
/**
 * @route   POST /v1/security/2fa/verify
 * @desc    Verify 2FA token during login
 * @access  Private
 */
router.post('/2fa/verify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { token } = req.body;
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!token) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'token is required'
            });
        }
        // Verify token
        const valid = yield twoFactorService.verifyLogin(user._id.toString(), token);
        if (!valid) {
            return res.status(400).json({
                error: '2FA verification failed',
                message: 'Invalid token'
            });
        }
        res.json({
            success: true,
            message: '2FA verified successfully'
        });
    }
    catch (error) {
        console.error('2FA verify error:', error);
        res.status(400).json({
            error: 'Failed to verify 2FA',
            message: error.message
        });
    }
}));
/**
 * @route   POST /v1/security/2fa/backup-codes
 * @desc    Generate backup codes
 * @access  Private
 */
router.post('/2fa/backup-codes', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        // Check if 2FA is enabled
        const is2FAEnabled = yield twoFactorService.is2FAEnabled(user._id.toString());
        if (!is2FAEnabled) {
            return res.status(400).json({
                error: '2FA not enabled',
                message: 'Enable 2FA before generating backup codes'
            });
        }
        // Generate backup codes
        const codes = yield twoFactorService.generateBackupCodes(user._id.toString());
        res.json({
            success: true,
            codes,
            message: 'Save these backup codes in a secure location. They can be used to access your account if you lose your authenticator device.'
        });
    }
    catch (error) {
        console.error('Backup codes generation error:', error);
        res.status(500).json({
            error: 'Failed to generate backup codes',
            message: error.message
        });
    }
}));
/**
 * @route   GET /v1/security/2fa/status
 * @desc    Check 2FA status
 * @access  Private
 */
router.get('/2fa/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const enabled = yield twoFactorService.is2FAEnabled(user._id.toString());
        res.json({
            success: true,
            twoFactorEnabled: enabled
        });
    }
    catch (error) {
        console.error('2FA status error:', error);
        res.status(500).json({
            error: 'Failed to check 2FA status',
            message: error.message
        });
    }
}));
exports.default = router;
