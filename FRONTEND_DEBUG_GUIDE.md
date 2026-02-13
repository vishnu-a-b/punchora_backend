# Frontend 403/401 Error - Debugging Guide

## Issue
Frontend getting 403 Forbidden when calling `/v1/business`

## Root Cause
**Authentication token is missing or invalid**

Backend actually returns 401, but frontend might be interpreting it as 403.

---

## Solution Steps

### 1. Check Browser Console (F12)

Open DevTools → Console and check for:
```
Network Tab → Click on the failed request → Headers
```

Look for:
- **Request Headers** - Is `Authorization: Bearer <token>` present?
- **Response** - What's the actual status code? 401 or 403?

### 2. Check if User is Logged In

In your frontend code, check:

```typescript
// Check if token exists
const token = localStorage.getItem('token'); // or however you store it
console.log('Token:', token ? 'EXISTS' : 'MISSING');

// Check if token is being sent
console.log('Auth header:', headers.Authorization);
```

### 3. Fix: Ensure Login Works First

**Before accessing `/v1/business`, you MUST login:**

```typescript
// 1. Login to get token
const loginResponse = await fetch('http://localhost:3002/v1/auth/jwt/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'your-username',
    password: 'your-password'
  })
});

const { token } = await loginResponse.json();

// 2. Store token
localStorage.setItem('token', token);

// 3. Now use token for other requests
const businessResponse = await fetch('http://localhost:3002/v1/business', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 4. Check Your API Helper/Axios Config

If using an API helper (like `fetchData.ts`), ensure it:

```typescript
// fetchData.ts or apiClient.ts
const getAuthHeaders = () => {
  const token = localStorage.getItem('token'); // or from cookies

  if (!token) {
    console.warn('No auth token found!');
    return {};
  }

  return {
    'Authorization': `Bearer ${token}`
  };
};

export const fetchData = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    // Token expired or invalid - redirect to login
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response.json();
};
```

---

## Quick Test in Browser Console

Open browser console (F12) and run:

```javascript
// Test 1: Check if you can login
fetch('http://localhost:3002/v1/auth/jwt/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin', // use your actual credentials
    password: 'password'
  })
})
.then(r => r.json())
.then(data => {
  console.log('Login response:', data);
  if (data.access_token) {
    // Store it
    localStorage.setItem('token', data.access_token);
    console.log('✅ Token saved!');
  }
});

// Test 2: Try to get business data with token
const token = localStorage.getItem('token');
fetch('http://localhost:3002/v1/business', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(data => console.log('Business data:', data));
```

---

## Common Issues & Fixes

### Issue 1: Token Not Being Sent
**Symptom:** Network tab shows no `Authorization` header

**Fix:** Check your API client configuration
```typescript
// Make sure your axios/fetch instance includes auth headers
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Issue 2: Token Expired
**Symptom:** Was working, now getting 401

**Fix:** Login again to get fresh token

### Issue 3: CORS Issues
**Symptom:** Browser blocks request, see CORS error

**Fix:** Backend already has CORS enabled, but check if credentials are needed:
```typescript
fetch(url, {
  credentials: 'include', // if using cookies
  headers: { Authorization: `Bearer ${token}` }
});
```

### Issue 4: Wrong Login Endpoint
**Check your login code uses:** `POST /v1/auth/jwt/create`

**Response format:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": { ... }
}
```

---

## Expected Flow

```
1. User opens app
   ↓
2. App checks localStorage for token
   ↓
3. If no token → Redirect to /login
   ↓
4. User enters credentials → POST /v1/auth/jwt/create
   ↓
5. Backend returns { access_token: "..." }
   ↓
6. App saves token to localStorage
   ↓
7. App redirects to /super-admin
   ↓
8. AppSidebar fetches business data
   ↓
9. fetchData includes Authorization header
   ↓
10. Backend validates token → Returns business list
```

---

## Check Your Login Page

Make sure your login page:

1. **Calls the correct endpoint:**
   ```typescript
   POST http://localhost:3002/v1/auth/jwt/create
   ```

2. **Sends correct payload:**
   ```json
   {
     "username": "admin",
     "password": "yourpassword"
   }
   ```

3. **Stores the token:**
   ```typescript
   localStorage.setItem('token', response.access_token);
   ```

4. **Redirects after success:**
   ```typescript
   router.push('/super-admin');
   ```

---

## Test Backend is Working

```bash
# Test login
curl -X POST http://localhost:3002/v1/auth/jwt/create \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpassword"}'

# Should return:
# {"access_token": "eyJ...", "refresh_token": "...", "user": {...}}

# Test business endpoint with token
curl http://localhost:3002/v1/business \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Should return business list
```

---

## Most Likely Fix

**Your frontend isn't logged in yet** or **the token isn't being sent**.

1. Go to `/login` in your app
2. Login with valid credentials
3. Check browser console for any errors
4. Verify token is stored: `localStorage.getItem('token')`
5. Navigate to `/super-admin` - should work now

---

## If Still Getting 403

If you're SURE the token is being sent and it's valid, check:

1. **Environment variable** - Is `ENABLE_IP_WHITELIST=true` set?
   - If yes, disable it or add your IP to whitelist

2. **Check server logs** for the actual error
   - Look for `[CSRF]` or `[IP]` messages

3. **Try accessing from different browser** (incognito mode)
   - Clears any cached auth state

---

**TL;DR: Login first, then the business endpoint will work!** ✅
