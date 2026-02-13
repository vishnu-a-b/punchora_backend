/**
 * Unit Tests for Auth Services
 * Tests JWT token generation and validation
 */

import { generateTokens } from '../../src/modules/authentication/utils/generateJwtTokens';
import verifyRefreshToken from '../../src/modules/authentication/utils/verifyRefreshToken';
import { Token } from '../../src/modules/user/models/UserToken';
import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';

const jwt = require('jsonwebtoken');

describe('AuthService', () => {
  setupTestDB();

  describe('generateTokens', () => {
    it('should generate access token and refresh token', async () => {
      const userId = mockObjectId().toString();

      const tokens = await generateTokens(userId);

      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should store refresh token in database', async () => {
      const userId = mockObjectId().toString();

      await generateTokens(userId);

      const userToken = await Token.findOne({ user: userId });
      expect(userToken).toBeTruthy();
      expect(userToken!.refreshToken).toBeTruthy();
    });

    it('should reuse valid refresh token', async () => {
      const userId = mockObjectId().toString();

      const tokens1 = await generateTokens(userId);
      const tokens2 = await generateTokens(userId);

      // Access tokens should be different (each have unique expiry)
      // But refresh tokens might be reused if still valid
      expect(tokens2.refreshToken).toBeTruthy();
    });

    it('should generate new refresh token if expired', async () => {
      const userId = mockObjectId().toString();

      // Create expired refresh token
      const expiredToken = jwt.sign({ id: userId }, 'test-secret', { expiresIn: '0s' });
      await Token.create({ user: userId, refreshToken: expiredToken });

      // Wait a moment to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      const tokens = await generateTokens(userId);

      expect(tokens.refreshToken).toBeTruthy();
      expect(tokens.refreshToken).not.toBe(expiredToken);
    });

    it('should replace old token with new token in database', async () => {
      const userId = mockObjectId().toString();

      await generateTokens(userId);
      await generateTokens(userId);

      const userTokens = await Token.find({ user: userId });
      expect(userTokens).toHaveLength(1);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', async () => {
      const userId = mockObjectId().toString();

      const tokens = await generateTokens(userId);

      const payload: any = await verifyRefreshToken(tokens.refreshToken);

      expect(payload).toBeTruthy();
      expect(payload.id).toBe(userId);
    });

    it('should reject invalid refresh token', async () => {
      const invalidToken = 'invalid.token.here';

      await expect(
        verifyRefreshToken(invalidToken)
      ).rejects.toMatchObject({ message: 'Invalid refresh token' });
    });

    it('should reject expired refresh token', async () => {
      const userId = mockObjectId().toString();
      const expiredToken = jwt.sign({ id: userId }, 'test-secret', { expiresIn: '0s' });

      await Token.create({ user: userId, refreshToken: expiredToken });

      // Wait to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      await expect(
        verifyRefreshToken(expiredToken)
      ).rejects.toMatchObject({ message: 'Invalid refresh token' });
    });
  });
});
