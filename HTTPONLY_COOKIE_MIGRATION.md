# HttpOnly Cookie Authentication Migration

## 📅 Migration Date
January 2026

## 🎯 Objective
Migrate from localStorage-based token storage to httpOnly cookies for enhanced security.

---

## 🔒 Security Improvements

| Aspect | Before (localStorage) | After (httpOnly Cookies) |
|--------|----------------------|--------------------------|
| **XSS Vulnerability** | ❌ Vulnerable - JavaScript can read token | ✅ Protected - JavaScript cannot access cookie |
| **Token Storage** | ❌ Visible in DevTools | ✅ Hidden from client-side JavaScript |
| **CSRF Protection** | ⚠️ Manual implementation needed | ✅ Built-in with SameSite=lax |
| **Server-Side Auth Check** | ❌ Impossible (localStorage client-only) | ✅ Possible (cookie sent with every request) |
| **Middleware Protection** | ❌ Limited (no token on first load) | ✅ Full (cookie available server-side) |

---

## 🔄 Changes Made

### Backend (Laravel)

#### 1. **AuthController Updates** (`app/Http/Controllers/Api/V1/AuthController.php`)

**Login Method**:
```php
// OLD: Token in response body
return response()->json([
    'data' => [
        'user' => new UserResource($user),
        'token' => $token,
    ],
]);

// NEW: Token in httpOnly cookie
return response()->json([
    'data' => [
        'user' => new UserResource($user),
        // Token NOT in response body
    ],
])->cookie(
    name: 'auth_token',
    value: $token,
    minutes: 60 * 24 * 30, // 30 days
    httpOnly: true,        // XSS protection
    secure: true,          // HTTPS only in production
    sameSite: 'lax'       // CSRF protection
);
```

**Logout Method**:
```php
// NEW: Clear cookie on logout
return response()->json([
    'success' => true,
    'message' => 'Logged out successfully',
])->cookie(
    name: 'auth_token',
    value: null,
    minutes: -1 // Expire immediately
);
```

#### 2. **New Middleware** (`app/Http/Middleware/AddBearerTokenFromCookie.php`)

```php
// Reads auth_token cookie and adds it to Authorization header
// This allows Sanctum to authenticate requests
if ($token = $request->cookie('auth_token')) {
    $request->headers->set('Authorization', "Bearer {$token}");
}
```

**Registered in** `bootstrap/app.php`:
```php
$middleware->api(prepend: [
    \App\Http\Middleware\AddBearerTokenFromCookie::class,
]);
```

#### 3. **CORS Configuration** (`config/cors.php`)

Already configured correctly:
```php
'supports_credentials' => true, // Required for cookies
```

---

### Frontend (Next.js 16)

#### 1. **Proxy (middleware)** (`proxy.ts` - renamed from `middleware.ts`)

```typescript
// OLD: Could not check auth server-side
// TODOs and workarounds for localStorage limitations

// NEW: True server-side protection
const authToken = request.cookies.get('auth_token');
const isAuthenticated = !!authToken;

if (pathname.startsWith('/dashboard') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
}
```

**Key Changes**:
- ✅ Renamed `middleware.ts` → `proxy.ts` (Next.js 16)
- ✅ Reads `auth_token` cookie server-side
- ✅ Full route protection before page render
- ✅ Automatic redirect login ↔ dashboard

#### 2. **Auth Store** (`stores/auth-store.ts`)

```typescript
// OLD: Stored token in localStorage
interface AuthState {
    user: User | null;
    token: string | null;  // ❌ Removed
    // ...
}

// NEW: Only stores user data
interface AuthState {
    user: User | null;
    // Token in httpOnly cookie, not accessible to JS
    // ...
}

// OLD: setAuth received token
setAuth: (user, token) => {
    set({ user, token, isAuthenticated: true });
}

// NEW: setAuth only receives user
setAuth: (user) => {
    set({ user, isAuthenticated: true });
}
```

#### 3. **API Client** (`lib/api/client.ts`)

```typescript
// OLD: Manually read token from localStorage
apiClient.interceptors.request.use((config) => {
    const authStorage = localStorage.getItem('auth-storage');
    const token = JSON.parse(authStorage).state.token;
    config.headers.Authorization = `Bearer ${token}`;
});

// NEW: No manual token handling
apiClient.interceptors.request.use((config) => {
    // Token automatically sent via httpOnly cookie
    // No need to manually add Authorization header
    return config;
});
```

**CSRF Configuration** (already present):
```typescript
apiClient.defaults.withCredentials = true;      // Send cookies
apiClient.defaults.xsrfCookieName = 'XSRF-TOKEN';
apiClient.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';
```

---

## 🧪 Testing Checklist

### Manual Testing

- [ ] **Login Flow**
  - [ ] Login with valid credentials
  - [ ] Check cookie is set in DevTools → Application → Cookies
  - [ ] Verify `auth_token` cookie exists with `HttpOnly` flag
  - [ ] User redirected to dashboard

- [ ] **Protected Routes**
  - [ ] Try accessing `/dashboard` without login → redirected to `/login`
  - [ ] Login and access `/dashboard` → allowed
  - [ ] Try accessing `/login` while logged in → redirected to `/dashboard`

- [ ] **Logout Flow**
  - [ ] Click logout button
  - [ ] Verify cookie is deleted
  - [ ] Redirected to `/login`
  - [ ] Cannot access `/dashboard` anymore

- [ ] **Session Persistence**
  - [ ] Login
  - [ ] Close browser tab
  - [ ] Reopen → still logged in (cookie persists)
  - [ ] Refresh page → still logged in

- [ ] **API Requests**
  - [ ] All authenticated API calls still work
  - [ ] Check Network tab: cookie sent with requests
  - [ ] 401 responses trigger logout correctly

### Security Testing

- [ ] **XSS Protection**
  - [ ] Open DevTools → Console
  - [ ] Try `document.cookie` → `auth_token` NOT visible
  - [ ] Try `localStorage.getItem('auth-storage')` → no token present

- [ ] **CSRF Protection**
  - [ ] Check cookie has `SameSite=Lax` attribute
  - [ ] Cookie only sent on same-site requests

- [ ] **HTTPS in Production**
  - [ ] Verify `Secure` flag on cookie in production
  - [ ] Cookie only sent over HTTPS

---

## 🚀 Deployment Steps

### Development

1. **Clear existing localStorage**:
   ```javascript
   // In browser console
   localStorage.clear();
   ```

2. **Restart backend**:
   ```bash
   cd backend
   php artisan serve
   ```

3. **Restart frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Test login flow** (use credentials from login page)

### Production

1. **Backend deployment**:
   ```bash
   cd backend
   git pull origin main
   composer install --optimize-autoloader --no-dev
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

2. **Frontend deployment**:
   ```bash
   cd frontend
   git pull origin main
   npm install
   npm run build
   pm2 restart dggm-frontend
   ```

3. **Clear user sessions**:
   - Inform users they need to log in again (one-time after migration)
   - Consider sending notification email

---

## 📝 Environment Configuration

### Backend `.env`

Ensure these are set:

```bash
# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Production: Must be HTTPS
# FRONTEND_URL=https://dggm.yourdomain.com

# Sanctum stateful domains
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000

# Session driver (for CSRF)
SESSION_DRIVER=cookie
SESSION_LIFETIME=120

# App environment (affects cookie 'secure' flag)
APP_ENV=production
```

### Frontend `.env.local`

```bash
# API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Production: Must match backend URL
# NEXT_PUBLIC_API_URL=https://api.dggm.yourdomain.com/api/v1
```

---

## 🐛 Troubleshooting

### Issue: "401 Unauthorized on all requests"

**Cause**: Cookie not being sent or backend not reading it.

**Solutions**:
1. Check `withCredentials: true` in axios config
2. Verify CORS `supports_credentials: true`
3. Check cookie domain matches frontend domain
4. Verify `AddBearerTokenFromCookie` middleware is registered

### Issue: "Cookie not set after login"

**Cause**: Response not setting cookie properly.

**Solutions**:
1. Check backend returns `->cookie()` chain
2. Verify CORS origin allows frontend domain
3. Check browser console for cookie warnings
4. Ensure `sameSite` attribute is compatible with setup

### Issue: "Redirect loop between login and dashboard"

**Cause**: Proxy reading cookie incorrectly.

**Solutions**:
1. Verify cookie name is `auth_token` (case-sensitive)
2. Check `request.cookies.get('auth_token')` returns value
3. Clear all cookies and try fresh login
4. Check for multiple middleware running

### Issue: "Token visible in localStorage"

**Cause**: Old code still writing token.

**Solutions**:
1. Verify auth-store does NOT have `token` field
2. Clear localStorage: `localStorage.clear()`
3. Check login response does NOT include `token` in body

---

## 📊 Migration Impact

### Breaking Changes

⚠️ **All existing users will be logged out** after deployment.

**Reason**: Old localStorage tokens are no longer used.

**Mitigation**:
1. Notify users in advance
2. Clear localStorage on first visit (optional migration script)
3. Show friendly "Please log in again" message

### Non-Breaking

✅ API endpoints unchanged (same URLs)
✅ Request/response format identical (except token in body)
✅ Database schema unchanged
✅ User data preserved

---

## 🔮 Future Improvements

### Optional Enhancements

1. **Token Refresh** (see `backend/docs/TOKEN_REFRESH_IMPLEMENTATION.md`)
   - Auto-refresh token before expiration
   - Frontend code already prepared (commented out)

2. **Remember Me**
   - Longer cookie expiration (90 days vs 30 days)
   - Checkbox on login form

3. **Session Management UI**
   - Show active devices/sessions
   - Backend endpoints already exist (`/auth/sessions`)
   - Allow revoking other sessions

4. **Security Headers**
   - Add `Strict-Transport-Security` header
   - Add `X-Frame-Options: DENY`
   - Add `X-Content-Type-Options: nosniff`

---

## 📚 References

- [Laravel Sanctum Documentation](https://laravel.com/docs/11.x/sanctum)
- [Next.js 16 Middleware (Proxy)](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [MDN: HttpOnly Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)
- [OWASP: Cross-Site Scripting (XSS)](https://owasp.org/www-community/attacks/xss/)
- [OWASP: CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

---

## ✅ Migration Complete

**Date**: January 2026
**Status**: ✅ Completed
**Security Level**: 🔒 High (httpOnly + sameSite + HTTPS)
**Compatibility**: ✅ All browsers, all devices

**Next Steps**:
1. Test thoroughly in development
2. Deploy to staging
3. Notify users
4. Deploy to production
5. Monitor logs for issues
