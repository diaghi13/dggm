<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login user and return access token
     * Allows multiple active sessions (multi-device login)
     * Token is stored in httpOnly cookie for security
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::with('worker')->where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Allow multiple active sessions - do NOT revoke previous tokens
        // Each device/session gets its own token

        // Create token name with device info for tracking
        $deviceName = $request->input('device_name', 'Unknown Device');
        $userAgent = $request->userAgent() ?? 'Unknown';
        $tokenName = sprintf('%s (%s)', $deviceName, substr($userAgent, 0, 50));

        // Create new token for this device
        $token = $user->createToken($tokenName)->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => new UserResource($user),
                // Don't send token in response body for httpOnly cookie approach
                // 'token' => $token,
            ],
        ])->cookie(
            'auth_token',                           // name
            $token,                                  // value
            60 * 24 * 30,                           // minutes (30 days)
            '/',                                     // path
            null,                                    // domain
            config('app.env') === 'production',     // secure (HTTPS only in production)
            true,                                    // httpOnly (XSS protection)
            false,                                   // raw
            'lax'                                    // sameSite (CSRF protection)
        );
    }

    /**
     * Logout user (revoke current token and clear cookie)
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ])->cookie(
            'auth_token',                           // name
            null,                                    // value (null to delete)
            -1,                                      // minutes (expire immediately)
            '/',                                     // path
            null,                                    // domain
            config('app.env') === 'production',     // secure
            true,                                    // httpOnly
            false,                                   // raw
            'lax'                                    // sameSite
        );
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('worker');

        return response()->json([
            'success' => true,
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Get all active sessions for the authenticated user
     */
    public function sessions(Request $request): JsonResponse
    {
        $tokens = $request->user()->tokens()
            ->orderBy('last_used_at', 'desc')
            ->get()
            ->map(function ($token) use ($request) {
                return [
                    'id' => $token->id,
                    'name' => $token->name,
                    'last_used_at' => $token->last_used_at?->diffForHumans(),
                    'created_at' => $token->created_at->diffForHumans(),
                    'is_current' => $token->id === $request->user()->currentAccessToken()->id,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $tokens,
        ]);
    }

    /**
     * Revoke a specific session/token
     */
    public function revokeSession(Request $request, int $tokenId): JsonResponse
    {
        $token = $request->user()->tokens()->find($tokenId);

        if (! $token) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found',
            ], 404);
        }

        // Prevent revoking current session
        if ($token->id === $request->user()->currentAccessToken()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot revoke current session. Use logout instead.',
            ], 400);
        }

        $token->delete();

        return response()->json([
            'success' => true,
            'message' => 'Session revoked successfully',
        ]);
    }

    /**
     * Revoke all other sessions except the current one
     */
    public function revokeOtherSessions(Request $request): JsonResponse
    {
        $currentTokenId = $request->user()->currentAccessToken()->id;

        $revokedCount = $request->user()
            ->tokens()
            ->where('id', '!=', $currentTokenId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => sprintf('Revoked %d other session(s)', $revokedCount),
            'revoked_count' => $revokedCount,
        ]);
    }
}
