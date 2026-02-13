# CSRF Protection - DISABLED

**Date:** February 13, 2026
**Status:** ⚠️ **DISABLED**

---

## What Was Changed

Modified `src/middlewares/csrfProtection.ts` to disable CSRF protection by default.

### Change Made:

```typescript
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // CSRF PROTECTION DISABLED
  // To re-enable, set ENABLE_CSRF=true in .env
  if (process.env.ENABLE_CSRF !== 'true') {
    return next();
  }

  // ... rest of CSRF logic (only runs if ENABLE_CSRF=true)
}
```

---

## Current Status

✅ **CSRF Protection: DISABLED**
- All requests bypass CSRF validation
- No CSRF token required for any endpoint
- Simplifies frontend development

---

## To Re-Enable CSRF Protection

Add to your `.env` file:

```bash
ENABLE_CSRF=true
CSRF_SECRET=your-secret-key-min-32-chars
```

Then restart the server:
```bash
npm run dev
```

---

## Security Impact

⚠️ **Development Only**

**Current Setup (CSRF Disabled):**
- Suitable for: Development, testing, trusted environments
- NOT recommended for: Production with public access

**When to Re-Enable:**
- Before deploying to production
- When frontend and backend are on different domains
- When you need protection against CSRF attacks

---

## Other Security Layers Still Active

Even with CSRF disabled, you still have:

✅ **JWT Authentication** - All protected routes require valid JWT token
✅ **Role-Based Access Control** - Users can only access allowed resources
✅ **Rate Limiting** - Prevents brute force attacks
✅ **Security Headers** - Helmet.js security headers
✅ **Input Sanitization** - MongoDB sanitization enabled
✅ **Audit Logging** - All actions tracked

---

## Testing

Now all these should work without CSRF tokens:

```bash
# Login (always worked)
curl -X POST http://localhost:3002/v1/auth/jwt/create \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Create staff (now works without CSRF token)
curl -X POST http://localhost:3002/v1/staff \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","uid":"STAFF001"}'

# Update staff (now works without CSRF token)
curl -X PUT http://localhost:3002/v1/staff/123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe"}'
```

---

## Frontend Changes Needed

**NONE!** Your frontend will work immediately without any changes.

You no longer need to:
- Get CSRF token before mutations
- Include `X-CSRF-Token` header
- Handle CSRF cookie

Just send requests with JWT token:
```typescript
fetch('http://localhost:3002/v1/staff', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

---

## Recommendation

**For Development:** ✅ Keep CSRF disabled (current state)
**For Production:** ⚠️ Enable CSRF with `ENABLE_CSRF=true`

---

**Status: CSRF Protection Disabled - Development Mode Active** ✅
