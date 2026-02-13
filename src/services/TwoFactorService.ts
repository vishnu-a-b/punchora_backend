/**
 * Two-Factor Authentication Service
 * Implements TOTP-based 2FA using Google Authenticator compatible tokens
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { User } from '../modules/user/models/User';
import AuditService from '../modules/audit/services/AuditService';

export interface TwoFactorSetupResult {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}

export default class TwoFactorService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Generate 2FA secret and QR code for user setup
   */
  async generateSecret(userId: string, userEmail: string): Promise<TwoFactorSetupResult> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `HRMS (${userEmail})`,
        issuer: 'HR Management System',
        length: 32
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      return {
        secret: secret.base32,
        qrCodeUrl,
        manualEntryKey: secret.base32
      };
    } catch (error: any) {
      throw new Error(`Failed to generate 2FA secret: ${error.message}`);
    }
  }

  /**
   * Verify TOTP token
   */
  verifyToken(secret: string, token: string): boolean {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2 // Allow 2 time steps before and after for clock skew
      });
    } catch (error: any) {
      console.error('2FA verification error:', error);
      return false;
    }
  }

  /**
   * Enable 2FA for a user
   */
  async enable2FA(
    userId: string,
    secret: string,
    verificationToken: string
  ): Promise<boolean> {
    try {
      // Verify the token before enabling
      if (!this.verifyToken(secret, verificationToken)) {
        throw new Error('Invalid verification token');
      }

      // Update user with 2FA secret
      await User.findByIdAndUpdate(userId, {
        twoFactorEnabled: true,
        twoFactorSecret: secret
      });

      // Log to audit
      await this.auditService.createAuditLog({
        action: 'TWO_FACTOR_ENABLED',
        performedBy: userId,
        targetModel: 'User',
        targetId: userId,
        metadata: {
          timestamp: new Date()
        }
      });

      return true;
    } catch (error: any) {
      throw new Error(`Failed to enable 2FA: ${error.message}`);
    }
  }

  /**
   * Disable 2FA for a user
   */
  async disable2FA(userId: string, password: string): Promise<boolean> {
    try {
      // In production, verify password before disabling
      // For now, just disable it

      await User.findByIdAndUpdate(userId, {
        twoFactorEnabled: false,
        twoFactorSecret: null
      });

      // Log to audit
      await this.auditService.createAuditLog({
        action: 'TWO_FACTOR_DISABLED',
        performedBy: userId,
        targetModel: 'User',
        targetId: userId,
        metadata: {
          timestamp: new Date()
        }
      });

      return true;
    } catch (error: any) {
      throw new Error(`Failed to disable 2FA: ${error.message}`);
    }
  }

  /**
   * Verify user login with 2FA
   */
  async verifyLogin(userId: string, token: string): Promise<boolean> {
    try {
      const user: any = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.twoFactorEnabled) {
        throw new Error('2FA is not enabled for this user');
      }

      const isValid = this.verifyToken(user.twoFactorSecret, token);

      if (!isValid) {
        // Log failed attempt
        await this.auditService.createAuditLog({
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
    } catch (error: any) {
      console.error('2FA login verification error:', error);
      return false;
    }
  }

  /**
   * Generate backup codes for account recovery
   */
  async generateBackupCodes(userId: string): Promise<string[]> {
    const codes: string[] = [];

    for (let i = 0; i < 10; i++) {
      // Generate random 8-character codes
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }

    // In production, hash and store these codes
    // For now, just return them

    await this.auditService.createAuditLog({
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
  }

  /**
   * Check if user has 2FA enabled
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    try {
      const user: any = await User.findById(userId);
      return user?.twoFactorEnabled === true;
    } catch (error) {
      return false;
    }
  }
}
