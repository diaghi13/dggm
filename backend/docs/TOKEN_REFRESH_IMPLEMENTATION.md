# Token Refresh Implementation Guide

## Overview

This document describes how to implement automatic token refresh for Laravel Sanctum tokens.

**Current Status**: ❌ Not implemented (frontend has skeleton code ready)

**Priority**: Medium (improves UX, prevents unexpected logouts)

---

## Why Token Refresh?

**Problem**: Sanctum tokens expire after a certain time (default: no expiration, but best practice is 1-24 hours).

**Without Refresh**:
- User is suddenly logged out mid-session
- Poor UX, especially during long work sessions
- User loses unsaved work

**With Refresh**:
- Token automatically renewed before expiration
- Seamless user experience
- User only logged out after true inactivity

---

## Backend Implementation

### 1. Add Token Expiration to Sanctum Config

```php
// config/sanctum.php

return [
    // Token expiration in minutes (null = never expires)
    // Recommended: 60 minutes for web, 24 hours for mobile
    'expiration' => 60, // 1 hour

    // ... other config
];
```

### 2. Create Refresh Endpoint

```php
// app/Http/Controllers/Api/V1/AuthController.php

/**
 * Refresh access token
 *
 * Revokes the old token and issues a new one.
 * This allows extending the user's session without requiring re-authentication.
 */
public function refresh(Request $request): JsonResponse
{
    $user = $request->user();

    // Get current token info before revoking
    $currentToken = $request->user()->currentAccessToken();
    $tokenName = $currentToken->name;

    // Revoke the old token
    $currentToken->delete();

    // Create new token with same name
    $newToken = $user->createToken($tokenName)->plainTextToken;

    return response()->json([
        'success' => true,
        'message' => 'Token refreshed successfully',
        'data' => [
            'user' => new UserResource($user->load('worker')),
            'token' => $newToken,
        ],
    ]);
}
```

### 3. Add Route

```php
// routes/api.php (V1 routes)

Route::middleware('auth:sanctum')->group(function () {
    // ... existing routes

    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
});
```

### 4. Test the Endpoint

```bash
# Test token refresh
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"

# Expected response:
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "user": { ... },
    "token": "NEW_TOKEN_HERE"
  }
}
```

---

## Frontend Implementation

### Current Status

The frontend already has the **token refresh skeleton code** in place:

**File**: `frontend/lib/api/client.ts`

**Lines**: 89-126 (commented out)

### Activation Steps

Once backend endpoint is ready, uncomment and activate:

```typescript
// In frontend/lib/api/client.ts

// BEFORE (line 89-126 commented):
// TODO: Implement token refresh endpoint in backend

// AFTER: Uncomment the code block
isRefreshing = true;
try {
  const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, {
    headers: {
      Authorization: originalRequest.headers?.Authorization
    }
  });

  const newToken = data.data.token;

  // Update token in storage
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const parsed = JSON.parse(authStorage);
    parsed.state.token = newToken;
    localStorage.setItem('auth-storage', JSON.stringify(parsed));
  }

  // Update original request with new token
  if (originalRequest.headers) {
    originalRequest.headers.Authorization = `Bearer ${newToken}`;
  }

  // Notify all queued requests
  onTokenRefreshed(newToken);
  isRefreshing = false;

  // Retry original request
  return apiClient(originalRequest);
} catch (refreshError) {
  isRefreshing = false;
  // Refresh failed, clear auth and redirect
  localStorage.removeItem('auth-storage');
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}
```

---

## How It Works

### Flow Diagram

```
1. User makes API request
   ↓
2. Backend returns 401 (token expired)
   ↓
3. Frontend intercepts 401
   ↓
4. Frontend calls /auth/refresh with old token
   ↓
5. Backend validates old token, issues new token
   ↓
6. Frontend saves new token to storage
   ↓
7. Frontend retries original request with new token
   ↓
8. Success! User never noticed
```

### Request Queuing

**Problem**: What if 10 requests fail simultaneously due to expired token?

**Solution**: Request queuing prevents race conditions:

```typescript
// Only ONE refresh happens at a time
if (isRefreshing) {
  // Queue this request until refresh completes
  return new Promise((resolve) => {
    subscribeTokenRefresh((token: string) => {
      // When refresh done, retry with new token
      resolve(apiClient(originalRequest));
    });
  });
}
```

**Result**:
- First 401 triggers refresh
- All other requests wait in queue
- When refresh completes, all queued requests retry with new token

---

## Security Considerations

### 1. Token Refresh Window

**Problem**: Should expired tokens be refreshable indefinitely?

**Solution**: Add "refresh window" - token can only be refreshed within X minutes of expiration.

```php
// Example: Token refreshable within 15 minutes of expiration
public function refresh(Request $request): JsonResponse
{
    $token = $request->user()->currentAccessToken();

    // Check if token is within refresh window
    $expiresAt = $token->created_at->addMinutes(config('sanctum.expiration'));
    $refreshWindowEnd = $expiresAt->addMinutes(15); // 15 min grace period

    if (now()->greaterThan($refreshWindowEnd)) {
        return response()->json([
            'success' => false,
            'message' => 'Token expired beyond refresh window. Please login again.',
        ], 401);
    }

    // ... rest of refresh logic
}
```

### 2. Refresh Rate Limiting

Prevent abuse by limiting refresh frequency:

```php
// Rate limit: max 1 refresh per 5 minutes
Route::middleware(['auth:sanctum', 'throttle:1,5'])
    ->post('/auth/refresh', [AuthController::class, 'refresh']);
```

### 3. Revoke on Suspicious Activity

If refresh fails multiple times, could indicate stolen token:

```php
// Track failed refresh attempts
if ($failedRefreshCount > 3) {
    // Revoke ALL user tokens
    $user->tokens()->delete();

    // Send security alert email
    Mail::to($user)->send(new SecurityAlertMail());
}
```

---

## Alternative: Sliding Session

Instead of explicit refresh, use **sliding session** approach:

```php
// Extend token expiration on every request
// In AuthServiceProvider or custom middleware

public function handle($request, Closure $next)
{
    if ($user = $request->user()) {
        $token = $user->currentAccessToken();

        // If token is more than 50% through its lifetime, extend it
        $halfLife = config('sanctum.expiration') / 2;
        if ($token->created_at->addMinutes($halfLife)->isPast()) {
            $token->update(['created_at' => now()]);
        }
    }

    return $next($request);
}
```

**Pros**:
- No separate refresh endpoint needed
- Automatic extension on activity
- Simpler implementation

**Cons**:
- Token never truly expires if user is active
- Database write on many requests (performance impact)

---

## Testing

### Backend Tests

```php
// tests/Feature/AuthRefreshTest.php

test('can refresh valid token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer $token")
        ->postJson('/api/v1/auth/refresh');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => ['user', 'token']
        ]);

    // Old token should be revoked
    expect($user->tokens()->count())->toBe(1);
});

test('cannot refresh expired token beyond grace period', function () {
    // Set token expiration to 1 hour
    config(['sanctum.expiration' => 60]);

    $user = User::factory()->create();
    $token = $user->createToken('test-token');

    // Simulate token created 2 hours ago (beyond grace period)
    $token->accessToken->update(['created_at' => now()->subHours(2)]);

    $response = $this->withHeader('Authorization', "Bearer {$token->plainTextToken}")
        ->postJson('/api/v1/auth/refresh');

    $response->assertUnauthorized();
});
```

### Frontend Tests

```typescript
// Test token refresh flow
test('automatically refreshes expired token', async () => {
  // Mock 401 response
  server.use(
    http.get('/api/v1/customers', () => {
      return HttpResponse.json({}, { status: 401 })
    })
  );

  // Mock successful refresh
  server.use(
    http.post('/api/v1/auth/refresh', () => {
      return HttpResponse.json({
        success: true,
        data: { token: 'new-token', user: mockUser }
      })
    })
  );

  // Original request should succeed after refresh
  const response = await apiClient.get('/customers');
  expect(response.status).toBe(200);
});
```

---

## Migration Path

### Phase 1: Backend (Week 1)
1. ✅ Add token expiration config
2. ✅ Create refresh endpoint
3. ✅ Add tests
4. ✅ Deploy to staging

### Phase 2: Frontend (Week 2)
1. ✅ Uncomment refresh code in apiClient
2. ✅ Test with short token expiration (5 min)
3. ✅ Monitor errors in Sentry
4. ✅ Deploy to production

### Phase 3: Monitor (Week 3)
1. ✅ Track refresh success rate
2. ✅ Adjust expiration times based on usage
3. ✅ Fine-tune refresh window

---

## Current Recommendation

**For this project**: ✅ **Implement explicit refresh endpoint**

**Reasons**:
1. Clean separation of concerns
2. Better security (controlled token lifecycle)
3. Frontend code already prepared
4. Works well with multi-device sessions

**Timeline**:
- Backend implementation: ~2 hours
- Frontend activation: ~30 minutes
- Testing: ~1 hour
- **Total**: Half day of work for significant UX improvement

---

**Status**: Ready for implementation when team prioritizes
**Dependencies**: None (independent feature)
**Risk**: Low (backwards compatible, optional feature)
