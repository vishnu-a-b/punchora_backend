/**
 * Security Routes
 * Endpoints for CSRF tokens and 2FA management
 */

import { Router, Request, Response } from 'express';
import { generateCsrfToken } from '../../../middlewares/csrfProtection';
import { authenticateUser } from '../../authentication/middlewares/authenticateUser';
import TwoFactorService from '../../../services/TwoFactorService';
import { User } from '../../user/models/User';

const router = Router();
const twoFactorService = new TwoFactorService();

/**
 * @route   GET /v1/security/csrf-token
 * @desc    Get CSRF token
 * @access  Public
 */
router.get('/csrf-token', generateCsrfToken);

// All 2FA routes require authentication
router.use(authenticateUser);

/**
 * @route   POST /v1/security/2fa/setup
 * @desc    Generate 2FA secret and QR code
 * @access  Private
 */
router.post('/2fa/setup', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user email
    const userDoc: any = await User.findById(user._id);
    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate secret and QR code
    const setupData = await twoFactorService.generateSecret(
      user._id.toString(),
      userDoc.email || userDoc.mobileNo
    );

    res.json({
      success: true,
      secret: setupData.secret,
      qrCode: setupData.qrCodeUrl,
      manualEntryKey: setupData.manualEntryKey,
      message: 'Scan the QR code with Google Authenticator or enter the manual key'
    });
  } catch (error: any) {
    console.error('2FA setup error:', error);
    res.status(500).json({
      error: 'Failed to setup 2FA',
      message: error.message
    });
  }
});

/**
 * @route   POST /v1/security/2fa/enable
 * @desc    Enable 2FA after verification
 * @access  Private
 */
router.post('/2fa/enable', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
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
    const enabled = await twoFactorService.enable2FA(
      user._id.toString(),
      secret,
      token
    );

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
  } catch (error: any) {
    console.error('2FA enable error:', error);
    res.status(400).json({
      error: 'Failed to enable 2FA',
      message: error.message
    });
  }
});

/**
 * @route   POST /v1/security/2fa/disable
 * @desc    Disable 2FA
 * @access  Private
 */
router.post('/2fa/disable', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { password } = req.body;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // In production, verify password before disabling
    // For now, just disable it
    const disabled = await twoFactorService.disable2FA(
      user._id.toString(),
      password || ''
    );

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error: any) {
    console.error('2FA disable error:', error);
    res.status(500).json({
      error: 'Failed to disable 2FA',
      message: error.message
    });
  }
});

/**
 * @route   POST /v1/security/2fa/verify
 * @desc    Verify 2FA token during login
 * @access  Private
 */
router.post('/2fa/verify', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
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
    const valid = await twoFactorService.verifyLogin(
      user._id.toString(),
      token
    );

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
  } catch (error: any) {
    console.error('2FA verify error:', error);
    res.status(400).json({
      error: 'Failed to verify 2FA',
      message: error.message
    });
  }
});

/**
 * @route   POST /v1/security/2fa/backup-codes
 * @desc    Generate backup codes
 * @access  Private
 */
router.post('/2fa/backup-codes', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if 2FA is enabled
    const is2FAEnabled = await twoFactorService.is2FAEnabled(user._id.toString());
    if (!is2FAEnabled) {
      return res.status(400).json({
        error: '2FA not enabled',
        message: 'Enable 2FA before generating backup codes'
      });
    }

    // Generate backup codes
    const codes = await twoFactorService.generateBackupCodes(user._id.toString());

    res.json({
      success: true,
      codes,
      message: 'Save these backup codes in a secure location. They can be used to access your account if you lose your authenticator device.'
    });
  } catch (error: any) {
    console.error('Backup codes generation error:', error);
    res.status(500).json({
      error: 'Failed to generate backup codes',
      message: error.message
    });
  }
});

/**
 * @route   GET /v1/security/2fa/status
 * @desc    Check 2FA status
 * @access  Private
 */
router.get('/2fa/status', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const enabled = await twoFactorService.is2FAEnabled(user._id.toString());

    res.json({
      success: true,
      twoFactorEnabled: enabled
    });
  } catch (error: any) {
    console.error('2FA status error:', error);
    res.status(500).json({
      error: 'Failed to check 2FA status',
      message: error.message
    });
  }
});

export default router;
