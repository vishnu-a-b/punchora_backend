# API Security Guide

**Phase 6: Security Features**
**Version:** 1.0.0
**Last Updated:** February 2026

---

## Table of Contents

1. [Overview](#overview)
2. [CSRF Protection](#csrf-protection)
3. [API Key Authentication](#api-key-authentication)
4. [IP Whitelisting](#ip-whitelisting)
5. [Two-Factor Authentication](#two-factor-authentication)
6. [Security Headers](#security-headers)
7. [Rate Limiting](#rate-limiting)
8. [Audit Logging](#audit-logging)
9. [Best Practices](#best-practices)

---

## Overview

Phase 6 implements multiple layers of security:

| Feature | Purpose | Status |
|---------|---------|--------|
| CSRF Protection | Prevent cross-site request forgery | ✅ Enabled |
| API Keys | Third-party integrations | ✅ Enabled |
| IP Whitelisting | Restrict access by IP | ⚙️ Configurable |
| 2FA (TOTP) | Two-factor authentication | ✅ Enabled |
| Security Headers | HTTP security headers | ✅ Enabled |
| Rate Limiting | Prevent abuse | ✅ Enabled |
| Audit Logging | Track all actions | ✅ Enabled |

---

## CSRF Protection

### Overview

Implements **double-submit cookie** pattern to prevent CSRF attacks on all state-changing requests (POST, PUT, DELETE, PATCH).

### How It Works

1. Server generates CSRF token
2. Token sent in both:
   - Cookie: `__Host-csrf` (httpOnly, secure, sameSite=strict)
   - Response body or header
3. Client includes token in request header: `X-CSRF-Token`
4. Server validates token matches cookie

### Getting CSRF Token

**Endpoint:** `GET /v1/security/csrf-token`

**Request:**
```bash
curl http://localhost:3000/v1/security/csrf-token \
  -H "Authorization: Bearer <jwt-token>"
```

**Response:**
```json
{
  "csrfToken": "a1b2c3d4e5f6..."
}
```

**Cookie Set:**
```
__Host-csrf=a1b2c3d4e5f6...; HttpOnly; Secure; SameSite=Strict
```

### Using CSRF Token

**Protected Endpoints:** All POST, PUT, DELETE, PATCH requests

**Example Request:**
```bash
curl -X POST http://localhost:3000/v1/staff \
  -H "Authorization: Bearer <jwt-token>" \
  -H "X-CSRF-Token: a1b2c3d4e5f6..." \
  -H "Cookie: __Host-csrf=a1b2c3d4e5f6..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "uid": "STAFF001"
  }'
```

### Exemptions

CSRF protection is **bypassed** for:
- GET, HEAD, OPTIONS requests (safe methods)
- API key authenticated requests (header: `X-API-Key`)
- Mobile app requests (header: `X-Mobile-App: true`)
- Offline sync endpoints

### Configuration

**Environment Variable:**
```bash
ENABLE_CSRF=true  # Set to false to disable (not recommended)
CSRF_SECRET=your-32-char-secret  # Required
```

### Error Handling

**Invalid/Missing Token:**
```json
{
  "success": false,
  "error": "CSRF token validation failed"
}
```
**Status Code:** 403 Forbidden

---

## API Key Authentication

### Overview

API keys allow third-party services to authenticate without user credentials. Each key has:
- Unique identifier
- Business scope
- Permission array
- Optional expiration
- Usage tracking

### Creating API Keys

**Endpoint:** `POST /v1/api-keys`

**Request:**
```bash
curl -X POST http://localhost:3000/v1/api-keys \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Integration API Key",
    "permissions": ["staff:read", "attendance:read", "attendance:write"],
    "expiresIn": 365
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "64abc123...",
    "name": "Integration API Key",
    "key": "sk_live_a1b2c3d4e5f6...",
    "permissions": ["staff:read", "attendance:read", "attendance:write"],
    "expiresAt": "2027-02-12T00:00:00.000Z",
    "createdAt": "2026-02-12T12:00:00.000Z"
  }
}
```

**⚠️ Important:** Save the `key` value immediately - it will only be shown once!

### Using API Keys

**Header:**
```
X-API-Key: sk_live_a1b2c3d4e5f6...
```

**Example Request:**
```bash
curl -X GET http://localhost:3000/v1/staff \
  -H "X-API-Key: sk_live_a1b2c3d4e5f6..."
```

### Permissions

Available permissions:

| Permission | Description |
|------------|-------------|
| `staff:read` | View staff data |
| `staff:write` | Create/update staff |
| `attendance:read` | View attendance records |
| `attendance:write` | Create attendance records |
| `alert:read` | View alerts |
| `alert:write` | Create/update alerts |
| `activity:read` | View activities |
| `activity:write` | Create/update activities |
| `report:read` | Generate reports |
| `admin` | Full access (use cautiously) |

### Managing API Keys

#### List All Keys
```bash
GET /v1/api-keys
```

#### Get Key Details
```bash
GET /v1/api-keys/:id
```

#### Update Permissions
```bash
PATCH /v1/api-keys/:id
{
  "permissions": ["staff:read", "staff:write"]
}
```

#### Revoke Key
```bash
DELETE /v1/api-keys/:id
```

#### Rotate Key
```bash
POST /v1/api-keys/:id/rotate
```

### Security Best Practices

1. **Minimum Permissions:** Grant only required permissions
2. **Expiration:** Set expiration dates (max 1 year recommended)
3. **Rotation:** Rotate keys every 90-180 days
4. **Storage:** Store keys in environment variables, never in code
5. **Monitoring:** Review API key usage in audit logs
6. **Revocation:** Immediately revoke compromised keys

### Error Handling

**Invalid API Key:**
```json
{
  "success": false,
  "error": "Invalid API key"
}
```
**Status Code:** 401 Unauthorized

**Insufficient Permissions:**
```json
{
  "success": false,
  "error": "Insufficient permissions for this operation"
}
```
**Status Code:** 403 Forbidden

**Expired API Key:**
```json
{
  "success": false,
  "error": "API key has expired"
}
```
**Status Code:** 401 Unauthorized

---

## IP Whitelisting

### Overview

Restrict API access to specific IP addresses or CIDR ranges. Useful for:
- Restricting admin access
- Securing third-party integrations
- Compliance requirements

### Configuration

**Environment Variable:**
```bash
ENABLE_IP_WHITELIST=true
IP_WHITELIST=192.168.1.0/24,10.0.0.0/8,203.0.113.50
```

**Format:**
- Single IP: `192.168.1.100`
- CIDR range: `192.168.1.0/24`
- Multiple: Comma-separated

### Managing Whitelist

**Add IP Address:**
```bash
POST /v1/security/ip-whitelist
{
  "ip": "192.168.1.100",
  "description": "Office IP"
}
```

**List Whitelisted IPs:**
```bash
GET /v1/security/ip-whitelist
```

**Remove IP:**
```bash
DELETE /v1/security/ip-whitelist/:id
```

### Exemptions

- Super admin users can access from any IP
- Emergency bypass available via environment variable:
  ```bash
  IP_WHITELIST_BYPASS=true
  ```

### Error Handling

**Blocked IP:**
```json
{
  "success": false,
  "error": "Access denied: IP address not whitelisted"
}
```
**Status Code:** 403 Forbidden

**Audit:** All blocked attempts are logged to audit system.

---

## Two-Factor Authentication

### Overview

Time-based One-Time Password (TOTP) authentication using apps like:
- Google Authenticator
- Authy
- Microsoft Authenticator
- 1Password

### Setup Process

#### Step 1: Generate Secret

**Endpoint:** `POST /v1/security/2fa/setup`

**Request:**
```bash
curl -X POST http://localhost:3000/v1/security/2fa/setup \
  -H "Authorization: Bearer <jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "manualEntryKey": "JBSWY3DPEHPK3PXP",
    "backupCodes": [
      "12345678",
      "87654321",
      "11223344",
      "44332211",
      "55667788"
    ]
  }
}
```

#### Step 2: Scan QR Code

1. Open authenticator app
2. Scan `qrCodeUrl` QR code
3. Or manually enter `manualEntryKey`

#### Step 3: Verify and Enable

**Endpoint:** `POST /v1/security/2fa/enable`

**Request:**
```bash
curl -X POST http://localhost:3000/v1/security/2fa/enable \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "JBSWY3DPEHPK3PXP",
    "token": "123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Two-factor authentication enabled successfully"
}
```

### Login with 2FA

**Standard Login:**
```bash
POST /v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (2FA Required):**
```json
{
  "success": true,
  "requiresTwoFactor": true,
  "tempToken": "temp_abc123..."
}
```

**2FA Verification:**
```bash
POST /v1/security/2fa/verify
{
  "tempToken": "temp_abc123...",
  "token": "123456"
}
```

**Final Response:**
```json
{
  "success": true,
  "token": "jwt_token...",
  "refreshToken": "refresh_token...",
  "user": { ... }
}
```

### Backup Codes

Use backup codes if authenticator app is unavailable:

**Verify with Backup Code:**
```bash
POST /v1/security/2fa/verify-backup
{
  "tempToken": "temp_abc123...",
  "backupCode": "12345678"
}
```

**Regenerate Backup Codes:**
```bash
POST /v1/security/2fa/regenerate-backup-codes
```

### Disable 2FA

**Endpoint:** `POST /v1/security/2fa/disable`

**Request:**
```bash
curl -X POST http://localhost:3000/v1/security/2fa/disable \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "123456"
  }'
```

### Check 2FA Status

**Endpoint:** `GET /v1/security/2fa/status`

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "hasBackupCodes": true,
    "backupCodesRemaining": 4
  }
}
```

---

## Security Headers

### Implemented Headers

All responses include security headers via Helmet.js:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

### Configuration

Headers are automatically applied to all responses. No configuration needed.

---

## Rate Limiting

### Overview

Prevents abuse by limiting request frequency per IP address.

### Limits

| Endpoint Pattern | Limit | Window |
|------------------|-------|--------|
| `/v1/auth/login` | 5 requests | 15 minutes |
| `/v1/auth/*` | 20 requests | 15 minutes |
| `/v1/api-keys/*` | 100 requests | 1 hour |
| `/v1/dashboard/*` | 100 requests | 1 hour |
| All other endpoints | 1000 requests | 15 minutes |

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1644678900
```

### Rate Limit Exceeded

**Response:**
```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```
**Status Code:** 429 Too Many Requests

**Retry After:** Included in `Retry-After` header (seconds)

---

## Audit Logging

### Overview

All security-related actions are logged to audit system:

| Event | Action Code |
|-------|-------------|
| API key created | `API_KEY_CREATED` |
| API key revoked | `API_KEY_REVOKED` |
| API key used | `API_KEY_USED` |
| 2FA enabled | `TWO_FACTOR_ENABLED` |
| 2FA disabled | `TWO_FACTOR_DISABLED` |
| 2FA failed | `TWO_FACTOR_FAILED` |
| IP blocked | `IP_BLOCKED` |
| CSRF failed | `CSRF_VALIDATION_FAILED` |
| Login attempt | `LOGIN_ATTEMPT` |
| Login success | `LOGIN_SUCCESS` |
| Login failed | `LOGIN_FAILED` |

### Viewing Audit Logs

**Endpoint:** `GET /v1/audit`

**Query Parameters:**
- `action` - Filter by action code
- `userId` - Filter by user
- `startDate` - Date range start
- `endDate` - Date range end

**Example:**
```bash
curl "http://localhost:3000/v1/audit?action=API_KEY_CREATED&startDate=2026-02-01" \
  -H "Authorization: Bearer <admin-token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "action": "API_KEY_CREATED",
        "resource": "ApiKey",
        "userId": "64abc123...",
        "business": "64def456...",
        "metadata": {
          "keyName": "Integration API Key",
          "permissions": ["staff:read"]
        },
        "ipAddress": "192.168.1.100",
        "userAgent": "curl/7.64.1",
        "status": "success",
        "createdAt": "2026-02-12T12:00:00.000Z"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20
  }
}
```

---

## Best Practices

### For Developers

1. **Environment Variables**
   - Store secrets in `.env`, never in code
   - Use different secrets for dev/staging/production
   - Rotate secrets regularly (every 90 days)

2. **CSRF Tokens**
   - Always include in state-changing requests
   - Refresh token if expired
   - Handle 403 errors gracefully

3. **API Keys**
   - Use API keys for server-to-server only
   - Never expose API keys in client-side code
   - Implement key rotation schedule
   - Monitor usage in audit logs

4. **IP Whitelisting**
   - Start with strict whitelist
   - Document all whitelisted IPs
   - Review quarterly
   - Have emergency bypass plan

5. **2FA**
   - Strongly encourage for all users
   - Require for admin/privileged accounts
   - Provide clear setup instructions
   - Support multiple authenticator apps

### For Operations

1. **Monitoring**
   - Monitor failed authentication attempts
   - Alert on suspicious API key usage
   - Track rate limit violations
   - Review audit logs weekly

2. **Incident Response**
   - Have API key revocation procedure
   - Document 2FA bypass process (emergencies)
   - Monitor Sentry for security errors
   - Maintain security incident log

3. **Compliance**
   - Enable audit logging
   - Retain logs per compliance requirements
   - Regular security audits
   - Document security procedures

### For Users

1. **Passwords**
   - Use strong, unique passwords
   - Enable password manager
   - Change password if compromised

2. **2FA**
   - Enable 2FA on your account
   - Save backup codes securely
   - Keep authenticator app updated

3. **API Keys**
   - Treat like passwords
   - Store in secure password manager
   - Report lost/compromised keys immediately
   - Use separate keys for each integration

---

## Security Endpoints Reference

### CSRF

- `GET /v1/security/csrf-token` - Get CSRF token

### API Keys

- `POST /v1/api-keys` - Create API key
- `GET /v1/api-keys` - List all keys
- `GET /v1/api-keys/:id` - Get key details
- `PATCH /v1/api-keys/:id` - Update permissions
- `DELETE /v1/api-keys/:id` - Revoke key
- `POST /v1/api-keys/:id/rotate` - Rotate key

### IP Whitelist

- `GET /v1/security/ip-whitelist` - List whitelisted IPs
- `POST /v1/security/ip-whitelist` - Add IP
- `DELETE /v1/security/ip-whitelist/:id` - Remove IP

### Two-Factor Authentication

- `POST /v1/security/2fa/setup` - Generate 2FA secret
- `POST /v1/security/2fa/enable` - Enable 2FA
- `POST /v1/security/2fa/disable` - Disable 2FA
- `POST /v1/security/2fa/verify` - Verify TOTP token
- `POST /v1/security/2fa/verify-backup` - Verify backup code
- `POST /v1/security/2fa/regenerate-backup-codes` - New backup codes
- `GET /v1/security/2fa/status` - Check 2FA status

### Audit

- `GET /v1/audit` - View audit logs (admin only)

---

## Troubleshooting

### CSRF Issues

**Problem:** Getting 403 errors on POST requests

**Solutions:**
1. Ensure CSRF token is fresh (get new token)
2. Check cookie is being sent with request
3. Verify `X-CSRF-Token` header matches cookie value
4. For mobile apps, add `X-Mobile-App: true` header

### API Key Issues

**Problem:** 401 errors with API key

**Solutions:**
1. Verify key format: `sk_live_...`
2. Check key is not expired
3. Ensure key is active (not revoked)
4. Verify permissions match endpoint
5. Check business ID matches

### 2FA Issues

**Problem:** TOTP tokens not accepted

**Solutions:**
1. Verify system time is synchronized (NTP)
2. Account for time window (±30 seconds)
3. Try backup code if authenticator fails
4. Regenerate secret if persistent issues

### IP Whitelist Issues

**Problem:** 403 errors from valid IP

**Solutions:**
1. Verify IP in whitelist: `GET /v1/security/ip-whitelist`
2. Check for proxy/load balancer (use `X-Forwarded-For`)
3. Use CIDR range instead of single IP
4. Temporarily disable for debugging: `IP_WHITELIST_BYPASS=true`

---

**Security is a shared responsibility. Stay vigilant!** 🔒
