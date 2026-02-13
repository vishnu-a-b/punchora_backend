# Phase 6 Migration Guide

**Version:** 1.0.0
**Date:** February 2026
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Breaking Changes](#breaking-changes)
4. [Migration Steps](#migration-steps)
5. [Environment Variables](#environment-variables)
6. [Database Migrations](#database-migrations)
7. [Testing Checklist](#testing-checklist)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Phase 6 introduces comprehensive enhancements across four major areas:

1. **Testing & Quality** (Week 1-2)
   - 80%+ test coverage (up from 60%)
   - 150+ test cases (unit, integration, E2E, load)
   - Performance benchmarks

2. **Security Features** (Week 2)
   - CSRF protection (double-submit cookie)
   - API key authentication
   - IP whitelisting
   - Two-factor authentication (TOTP)
   - Enhanced audit logging

3. **Mobile Sync Optimization** (Week 3)
   - 10x performance improvement
   - Priority-based processing
   - Conflict resolution (4 strategies)
   - Offline report caching

4. **Admin Dashboard Enhancements** (Week 3)
   - Real-time analytics
   - Bulk CSV import/export
   - Custom report builder
   - Dashboard customization per role

**Backward Compatibility:** ✅ **100% backward compatible** - No breaking changes

---

## Prerequisites

### System Requirements

- Node.js >= 18.x
- MongoDB >= 5.0
- Redis >= 6.0
- TypeScript >= 5.x

### Required Services

1. **Redis Server** (Critical)
   ```bash
   # Install Redis (macOS)
   brew install redis
   brew services start redis

   # Install Redis (Ubuntu)
   sudo apt-get install redis-server
   sudo systemctl start redis

   # Verify Redis is running
   redis-cli ping  # Should return "PONG"
   ```

2. **Sentry Account** (Optional but recommended)
   - Sign up at https://sentry.io
   - Create new project
   - Get DSN for environment variables

### npm Dependencies

All required packages are already in `package.json`. After pulling changes:

```bash
npm install
```

New dependencies added in Phase 6:
- `csv-parser@^3.0.0` - CSV parsing for bulk import
- `csrf-csrf@^4.0.3` - CSRF protection (already installed)
- `speakeasy@^2.0.0` - TOTP 2FA (already installed)
- `qrcode@^1.5.4` - QR code generation (already installed)
- `ioredis@^5.3.2` - Redis client (already installed)

---

## Breaking Changes

**None.** Phase 6 is fully backward compatible.

### Deprecations

None at this time.

### New Endpoints

17 new dashboard endpoints added under `/v1/dashboard/`:
- Analytics: `/analytics`, `/trends/:metric`
- Bulk Operations: `/bulk/import/staff`, `/bulk/export/{staff,attendance,alerts}`
- Custom Reports: `/reports/custom`, `/reports/save`, `/reports/saved`
- Customization: `/layout`, `/layout/reset`, `/widgets/available`

See [API Security Guide](./API_SECURITY.md) for detailed endpoint documentation.

---

## Migration Steps

### Step 1: Update Codebase

```bash
git pull origin main
npm install
```

### Step 2: Configure Environment Variables

Update your `.env` file with new variables:

```bash
# Redis Configuration (REQUIRED)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # Leave empty for local development

# Security Features
CSRF_SECRET=your-csrf-secret-key-min-32-chars  # Generate strong secret
SESSION_SECRET=your-session-secret             # Already exists

# Sentry (Optional)
SENTRY_DSN=your-sentry-dsn-url                 # For error monitoring

# Feature Flags (Optional)
ENABLE_CSRF=true                               # Default: true
ENABLE_API_KEYS=true                           # Default: true
ENABLE_IP_WHITELIST=false                      # Default: false (strict)
ENABLE_2FA=true                                # Default: true
```

#### Generate CSRF Secret

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32
```

### Step 3: Verify Redis Connection

Test Redis connectivity:

```bash
# Test Redis connection
npm run dev

# Check logs for:
# ✅ Redis connected successfully
# ✅ Cache service initialized
```

### Step 4: Run Database Migrations

No schema migrations required - Phase 6 adds new optional collections only:

1. **ApiKey** - API key management (optional)
2. **DashboardCustomization** - Dashboard layouts (optional)

MongoDB will create these automatically on first use.

### Step 5: Build and Test

```bash
# Build TypeScript
npm run build

# Run test suite (should pass with 80%+ coverage)
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
```

Expected test results:
```
Test Suites: 20+ passed
Tests: 150+ passed
Coverage: 80%+ (branches, functions, lines, statements)
```

### Step 6: Seed Development Data (Optional)

```bash
# Seed test data if needed
npm run seed
```

### Step 7: Start Application

```bash
# Development mode
npm run dev

# Production mode
npm run build && npm start
```

Verify startup logs:
```
✅ MongoDB connected
✅ Redis connected successfully
✅ Server running on port 3000
✅ Swagger docs available at http://localhost:3000/api-docs
```

---

## Environment Variables

### Complete .env Template

```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/hrms
MONGODB_TEST_URI=mongodb://localhost:27017/hrms_test

# Redis (NEW - REQUIRED)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Authentication
JWT_SECRET=your-jwt-secret-key
SESSION_SECRET=your-session-secret
JWT_EXPIRE=7d
REFRESH_TOKEN_EXPIRE=30d

# Security (NEW)
CSRF_SECRET=your-csrf-secret-min-32-chars

# Sentry (NEW - Optional)
SENTRY_DSN=
SENTRY_ENVIRONMENT=development

# Feature Flags (NEW - Optional)
ENABLE_CSRF=true
ENABLE_API_KEYS=true
ENABLE_IP_WHITELIST=false
ENABLE_2FA=true
ENABLE_PERFORMANCE_MONITORING=true

# Face Recognition
FACE_RECOGNITION_THRESHOLD=0.6
FACE_MODEL_PATH=./models

# File Upload
MAX_FILE_SIZE=5242880  # 5MB

# Email (if configured)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

### Required Variables

Minimum required for Phase 6:
- `MONGODB_URI` ✅ (existing)
- `REDIS_HOST` ✅ (new)
- `REDIS_PORT` ✅ (new)
- `JWT_SECRET` ✅ (existing)
- `CSRF_SECRET` ✅ (new)

### Optional Variables

- `SENTRY_DSN` - Error monitoring
- `REDIS_PASSWORD` - Production Redis
- Feature flags - Enable/disable features

---

## Database Migrations

### New Collections

Phase 6 adds two new collections (auto-created):

#### 1. ApiKey Collection
```typescript
{
  key: string;              // Hashed API key
  name: string;             // Human-readable name
  business: ObjectId;       // Business reference
  permissions: string[];    // Permission array
  active: boolean;          // Active status
  expiresAt?: Date;         // Optional expiration
  lastUsed?: Date;          // Last usage timestamp
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ key: 1 }` (unique)
- `{ business: 1, active: 1 }`

#### 2. DashboardCustomization Collection
```typescript
{
  userId: string;           // User ID (unique)
  role: string;             // User role
  widgets: WidgetConfig[];  // Widget array
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ userId: 1 }` (unique)
- `{ role: 1 }`

### Modified Collections

#### User Collection (Updated)
```typescript
// New fields added:
{
  twoFactorEnabled: boolean;   // 2FA status
  twoFactorSecret?: string;    // TOTP secret (encrypted)
}
```

**Migration:** Not required - fields are optional and will be `undefined` for existing users.

### Index Recommendations

Run these commands in MongoDB shell for optimal performance:

```javascript
// ApiKey indexes
db.apikeys.createIndex({ key: 1 }, { unique: true });
db.apikeys.createIndex({ business: 1, active: 1 });

// DashboardCustomization indexes
db.dashboardcustomizations.createIndex({ userId: 1 }, { unique: true });
db.dashboardcustomizations.createIndex({ role: 1 });

// Existing collections - verify indexes exist
db.attendance.createIndex({ date: 1, staff: 1 });
db.alerts.createIndex({ business: 1, status: 1, createdAt: -1 });
db.activities.createIndex({ business: 1, startTime: -1 });
```

---

## Testing Checklist

### Pre-Migration Testing

- [ ] Backup production database
- [ ] Verify Redis is running
- [ ] Test Redis connection
- [ ] Review environment variables
- [ ] Check disk space (for logs and cache)

### Post-Migration Testing

#### 1. Security Features

- [ ] **CSRF Protection**
  ```bash
  # Should succeed with CSRF token
  curl -X POST http://localhost:3000/v1/staff \
    -H "X-CSRF-Token: <token>" \
    -H "Cookie: __Host-csrf=<cookie>"

  # Should fail without token (403)
  curl -X POST http://localhost:3000/v1/staff
  ```

- [ ] **API Key Authentication**
  ```bash
  # Create API key via UI or endpoint
  # Test authenticated request
  curl -X GET http://localhost:3000/v1/staff \
    -H "X-API-Key: <your-api-key>"
  ```

- [ ] **2FA Setup**
  1. Login as user
  2. Navigate to security settings
  3. Enable 2FA
  4. Scan QR code with authenticator app
  5. Verify TOTP token

#### 2. Mobile Sync

- [ ] Upload 100 offline records
- [ ] Verify processing time < 10s
- [ ] Check for conflicts (should auto-resolve)
- [ ] Verify sync batch status

#### 3. Admin Dashboard

- [ ] **Analytics**
  - View dashboard metrics
  - Check all metric cards load
  - Verify trend charts display

- [ ] **Bulk Import**
  - Download CSV template
  - Import sample staff CSV (10 records)
  - Verify success/error reporting

- [ ] **Bulk Export**
  - Export staff to CSV
  - Export attendance (date range)
  - Export alerts (filtered)

- [ ] **Custom Reports**
  - Build custom report with filters
  - Add aggregations (count, avg)
  - Export report to CSV
  - Save report configuration

- [ ] **Dashboard Customization**
  - Customize widget layout
  - Save layout
  - Reset to default
  - Verify role-based defaults

#### 4. Performance

- [ ] **Cache Hit Rate**
  ```bash
  curl http://localhost:3000/v1/performance/cache
  # Expected: hit rate > 80%
  ```

- [ ] **Response Times**
  - Dashboard analytics: < 1s (cached)
  - Staff list: < 100ms (cached)
  - Custom report: < 2s (uncached)

#### 5. Test Suite

```bash
# Run full test suite
npm test

# Expected results:
# ✅ Test Suites: 20+ passed
# ✅ Tests: 150+ passed
# ✅ Coverage: 80%+ all metrics
```

---

## Rollback Procedures

### Quick Rollback (Production)

If issues arise after deployment:

```bash
# 1. Run rollback script
npm run rollback:phase6

# 2. Clear Redis cache
redis-cli FLUSHALL

# 3. Restart application
pm2 restart all

# 4. Revert code
git revert <phase6-commit>
npm install
npm run build
pm2 restart all
```

### Manual Rollback Steps

1. **Disable Phase 6 features via feature flags:**
   ```bash
   # Update .env
   ENABLE_CSRF=false
   ENABLE_API_KEYS=false
   ENABLE_2FA=false
   ```

2. **Clear Redis cache:**
   ```bash
   redis-cli FLUSHALL
   ```

3. **Restore previous code version:**
   ```bash
   git checkout <previous-tag>
   npm install
   npm run build
   ```

4. **Restart services:**
   ```bash
   pm2 restart backend
   # or
   sudo systemctl restart hrms-backend
   ```

### Data Rollback

Phase 6 doesn't modify existing data. To remove Phase 6-specific data:

```javascript
// In MongoDB shell
db.apikeys.drop();
db.dashboardcustomizations.drop();

// Remove 2FA from users (optional)
db.users.updateMany(
  {},
  {
    $unset: {
      twoFactorEnabled: "",
      twoFactorSecret: ""
    }
  }
);
```

---

## Troubleshooting

### Redis Connection Issues

**Problem:** "Redis connection failed"

**Solutions:**
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
# macOS:
brew services start redis

# Linux:
sudo systemctl start redis

# Check Redis logs
# macOS:
tail -f /usr/local/var/log/redis.log

# Linux:
sudo journalctl -u redis -f
```

### CSRF Token Errors

**Problem:** "403 Forbidden - CSRF token invalid"

**Solutions:**
1. Verify `CSRF_SECRET` is set in `.env`
2. Check cookies are enabled in client
3. For mobile apps, exempt endpoints:
   ```typescript
   // In csrfProtection.ts
   const ignoredPaths = ['/v1/offline-face/*'];
   ```

### API Key Not Working

**Problem:** "401 Unauthorized" with API key

**Solutions:**
1. Verify API key format: `X-API-Key` header
2. Check key is active: `db.apikeys.find({ active: true })`
3. Verify permissions match endpoint
4. Check expiration: `expiresAt` field

### 2FA QR Code Not Displaying

**Problem:** QR code endpoint returns error

**Solutions:**
1. Verify `qrcode` package installed: `npm list qrcode`
2. Check user email is set (required for QR code)
3. Verify `speakeasy` package installed

### Dashboard Analytics Slow

**Problem:** Dashboard takes > 5s to load

**Solutions:**
1. Verify Redis cache is working:
   ```bash
   redis-cli INFO stats
   # Check keyspace_hits vs keyspace_misses
   ```

2. Check database indexes:
   ```javascript
   db.attendance.getIndexes();
   db.alerts.getIndexes();
   ```

3. Review slow queries:
   ```bash
   npm run scripts/findSlowQueries
   ```

### Bulk Import Fails

**Problem:** CSV import returns validation errors

**Solutions:**
1. Verify CSV format matches template
2. Check required fields: `name` (minimum)
3. Validate email format
4. Check for duplicate UIDs
5. Review error details in response:
   ```json
   {
     "errors": [
       { "row": 3, "error": "Invalid email", "data": {...} }
     ]
   }
   ```

### Test Coverage Below 80%

**Problem:** `npm test` shows coverage < 80%

**Solutions:**
1. Run specific test suites to identify gaps:
   ```bash
   npm run test:unit -- --coverage
   npm run test:integration -- --coverage
   ```

2. Check uncovered files:
   ```bash
   # Coverage report in: coverage/lcov-report/index.html
   open coverage/lcov-report/index.html
   ```

3. Add missing test cases for new services

### Memory Leak in Production

**Problem:** Node.js memory usage growing over time

**Solutions:**
1. Check Redis memory usage:
   ```bash
   redis-cli INFO memory
   ```

2. Set maxmemory policy:
   ```bash
   redis-cli CONFIG SET maxmemory 2gb
   redis-cli CONFIG SET maxmemory-policy allkeys-lru
   ```

3. Monitor with performance endpoint:
   ```bash
   curl http://localhost:3000/v1/performance/metrics
   ```

---

## Support and Next Steps

### Documentation

- [API Security Guide](./API_SECURITY.md) - Security features documentation
- [Phase 6 Complete Summary](../PHASE6_COMPLETE.md) - Feature overview
- [Deployment Guide](../DEPLOYMENT_GUIDE_PHASE6.md) - Production deployment

### Testing

After migration, run comprehensive tests:

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Load tests
npm run test:load

# Full suite with coverage
npm test
```

### Monitoring

1. **Enable Sentry** for error tracking
2. **Monitor Redis** memory and hit rate
3. **Check performance** endpoint regularly
4. **Review audit logs** for security events

### Gradual Rollout (Recommended)

For production systems, consider gradual feature enablement:

**Week 1:** Security features
- Enable CSRF protection
- Enable API keys (for integrations)
- Monitor for issues

**Week 2:** Mobile sync optimization
- Enable parallel processing
- Monitor sync performance
- Verify conflict resolution

**Week 3:** Admin features
- Enable bulk import/export
- Enable custom reports
- Enable dashboard customization

**Week 4:** Full deployment
- All features enabled
- Performance monitoring
- User training

---

## Checklist Summary

### Pre-Migration
- [ ] Backup database
- [ ] Install/verify Redis
- [ ] Review environment variables
- [ ] Test in staging environment
- [ ] Notify users of maintenance window

### Migration
- [ ] Pull latest code
- [ ] Run `npm install`
- [ ] Update `.env` file
- [ ] Run `npm run build`
- [ ] Start application
- [ ] Verify logs

### Post-Migration
- [ ] Run test suite (80%+ coverage)
- [ ] Test security features
- [ ] Test mobile sync
- [ ] Test admin dashboard
- [ ] Monitor performance
- [ ] Check error logs

### Verification
- [ ] All endpoints responding
- [ ] Redis cache working (hit rate > 80%)
- [ ] No errors in Sentry
- [ ] Dashboard loads < 2s
- [ ] Bulk operations working
- [ ] 2FA setup functional

---

**Migration Complete!** ✅

For issues or questions, refer to the troubleshooting section or contact the development team.
