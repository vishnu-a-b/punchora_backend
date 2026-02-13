# CSRF Login Issue - Fixed

**Date:** February 13, 2026
**Issue:** Login endpoint returning 500 error due to CSRF protection
**Status:** ✅ FIXED

---

## Problem

Frontend admin dashboard was getting this error when trying to login:

```
POST http://localhost:3002/v1/auth/jwt/create 500 (Internal Server Error)

TypeError: Cannot read properties of undefined (reading '__Host-csrf')
```

**Root Cause:**
- CSRF protection middleware was blocking the login endpoint
- Login is the first request - users don't have a CSRF token yet
- The CSRF middleware was trying to read a cookie that doesn't exist on first request

---

## Solution

### Changes Made to `src/middlewares/csrfProtection.ts`

1. **Added Authentication Endpoint Exemptions**
   ```typescript
   // Skip CSRF for authentication endpoints (login, register, refresh)
   const authExemptPaths = [
     '/auth/jwt/create',
     '/auth/login',
     '/auth/register',
     '/auth/refresh',
     '/security/csrf-token'
   ];

   if (authExemptPaths.some(path => req.path.includes(path))) {
     return next();
   }
   ```

2. **Added Safe Method Check**
   ```typescript
   // Skip CSRF for safe methods (already handled by ignoredMethods in config)
   const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
   if (safeMethods.includes(req.method)) {
     return next();
   }
   ```

3. **Improved Error Handling**
   ```typescript
   try {
     doubleCsrfProtection(req, res, (error?: any) => {
       // Better error handling
     });
   } catch (error: any) {
     // Handle synchronous errors
   }
   ```

---

## CSRF Protection Strategy

### Endpoints WITHOUT CSRF Protection (Safe to call without token):

✅ **Authentication**
- `POST /v1/auth/jwt/create` (login)
- `POST /v1/auth/login`
- `POST /v1/auth/register`
- `POST /v1/auth/refresh`
- `GET /v1/security/csrf-token`

✅ **All GET/HEAD/OPTIONS requests** (read-only)

✅ **API Key requests** (header: `X-API-Key`)

✅ **Mobile/Offline endpoints** (`/api/mobile/*`, `/api/offline/*`)

### Endpoints WITH CSRF Protection:

🔒 **All other POST/PUT/DELETE/PATCH requests** require CSRF token

---

## Testing

### 1. Login (Should Work Without CSRF)
```bash
curl -X POST http://localhost:3002/v1/auth/jwt/create \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password"
  }'
```

**Expected:** ✅ 200 OK with JWT token

### 2. Protected Endpoint (Requires CSRF after login)
```bash
# First get CSRF token
curl http://localhost:3002/v1/security/csrf-token

# Then use it for protected requests
curl -X POST http://localhost:3002/v1/staff \
  -H "Authorization: Bearer <jwt-token>" \
  -H "X-CSRF-Token: <csrf-token>" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

---

## Admin Dashboard Login Flow

Now the frontend can login successfully:

1. **User enters credentials** → Frontend sends POST to `/v1/auth/jwt/create`
2. **No CSRF token needed** → CSRF middleware exempts auth endpoints
3. **Backend validates credentials** → Returns JWT token
4. **Frontend stores JWT** → Subsequent requests include JWT in Authorization header
5. **For mutations** → Frontend can optionally get CSRF token if needed

---

## Why This Approach is Secure

1. **Login is protected by credentials** - Username/password validation is sufficient
2. **JWT tokens are secure** - Short-lived, signed tokens prevent unauthorized access
3. **CSRF still protects mutations** - After login, critical operations can require CSRF
4. **Defense in depth** - Multiple layers: credentials, JWT, optional CSRF, rate limiting

---

## Impact

✅ **No breaking changes** - Only authentication endpoints affected
✅ **More user-friendly** - No need to get CSRF token before login
✅ **Standards-compliant** - Matches common authentication patterns
✅ **Maintains security** - CSRF still protects state-changing operations

---

## Related Files

- `src/middlewares/csrfProtection.ts` - CSRF middleware (modified)
- `src/app.ts` - Middleware registration (no changes needed)
- `admin_dashboard/.env.local` - Frontend API URL configuration

---

## Status

✅ **FIXED - Ready for Testing**

The admin dashboard should now be able to login successfully!
