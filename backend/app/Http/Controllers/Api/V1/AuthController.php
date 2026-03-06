<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Auth\ChangePasswordAction;
use App\Actions\Auth\ResetPasswordAction;
use App\Actions\Auth\SendPasswordResetLinkAction;
use App\Data\ChangePasswordData;
use App\Data\ForgotPasswordData;
use App\Data\ResetPasswordData;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
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

        // Get public global settings
        $globalSettings = \App\Models\Setting::global()
            ->where('is_public', true)
            ->ordered()
            ->get()
            ->mapWithKeys(function ($setting) {
                return [$setting->key => $setting->getTypedValue()];
            });

        // Get user-specific settings
        $userSettings = \App\Models\Setting::forUser($user->id)
            ->ordered()
            ->get()
            ->mapWithKeys(function ($setting) {
                return [$setting->key => $setting->getTypedValue()];
            });

        // Get enabled feature flags (global + user-specific)
        $featureFlags = \App\Models\Setting::where('is_feature_flag', true)
            ->where(function ($query) use ($user) {
                $query->whereNull('user_id')
                    ->orWhere('user_id', $user->id);
            })
            ->get()
            ->filter(function ($setting) {
                return filter_var($setting->getTypedValue(), FILTER_VALIDATE_BOOLEAN);
            })
            ->pluck('key')
            ->toArray();

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => new UserResource($user),
                'settings' => [
                    'global' => $globalSettings,
                    'user' => $userSettings,
                ],
                'features' => $featureFlags,
                // Don't send token in response body for httpOnly cookie approach
                // 'token' => $token,
            ],
        ])->cookie(
            'auth_token',                                    // name
            $token,                                          // value
            60 * 24 * 30,                                    // minutes (30 days)
            config('session.path', '/'),                     // path
            config('session.domain'),                        // domain (from SESSION_DOMAIN env)
            config('session.secure', false),                 // secure (from SESSION_SECURE_COOKIE env)
            true,                                            // httpOnly (XSS protection)
            false,                                           // raw
            config('session.same_site', 'lax')               // sameSite (from SESSION_SAME_SITE env)
        );
    }

    /**
     * Logout user (revoke current token and clear cookie).
     * Public route: always clears the cookie, even if the token is already invalid.
     */
    public function logout(Request $request): JsonResponse
    {
        // Try to revoke the token if valid; ignore if already expired/missing (e.g. after DB reset)
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ])->cookie(
            'auth_token',                                    // name
            null,                                            // value (null to delete)
            -1,                                              // minutes (expire immediately)
            config('session.path', '/'),                     // path
            config('session.domain'),                        // domain (from SESSION_DOMAIN env)
            config('session.secure', false),                 // secure
            true,                                            // httpOnly
            false,                                           // raw
            config('session.same_site', 'lax')               // sameSite
        );
    }

    /**
     * Get current authenticated user with settings
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('worker');

        $allSettings = \App\Models\Setting::query()
            ->where(function ($query) use ($user) {
                $query->whereNull('user_id')
                    ->orWhere('user_id', $user->id);
            })
            ->ordered()
            ->get()
            ->mapWithKeys(function ($setting) {
                return [$setting->key => $setting->getTypedValue()];
            });

        // Get public global settings
        $globalSettings = \App\Models\Setting::global()
            // ->where('is_public', true)
            ->ordered()
            ->get()
            ->mapWithKeys(function ($setting) {
                return [$setting->key => $setting->getTypedValue()];
            });

        // Get user-specific settings
        $userSettings = \App\Models\Setting::forUser($user->id)
            ->ordered()
            ->get()
            ->mapWithKeys(function ($setting) {
                return [$setting->key => $setting->getTypedValue()];
            });

        // Get enabled feature flags (global + user-specific)
        $featureFlags = \App\Models\Setting::where('is_feature_flag', true)
            ->where(function ($query) use ($user) {
                $query->whereNull('user_id')
                    ->orWhere('user_id', $user->id);
            })
            ->get()
            ->filter(function ($setting) {
                return filter_var($setting->getTypedValue(), FILTER_VALIDATE_BOOLEAN);
            })
            ->pluck('key')
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => new UserResource($user),
                'settings' => [
                    // 'all' => $allSettings,
                    'global' => $globalSettings,
                    'user' => $userSettings,
                ],
                'features' => $featureFlags,
            ],
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

    /**
     * Send password reset link to user's email
     */
    public function forgotPassword(ForgotPasswordData $data): JsonResponse
    {
        $status = app(SendPasswordResetLinkAction::class)->execute($data);

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'success' => true,
                'message' => 'Password reset link sent to your email',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Unable to send password reset link',
        ], 500);
    }

    /**
     * Reset password using token from email
     */
    public function resetPassword(ResetPasswordData $data): JsonResponse
    {
        $status = app(ResetPasswordAction::class)->execute($data);

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully',
            ]);
        }

        // Handle different error cases
        $message = match ($status) {
            Password::INVALID_TOKEN => 'Invalid or expired reset token',
            Password::INVALID_USER => 'User not found',
            default => 'Unable to reset password',
        };

        return response()->json([
            'success' => false,
            'message' => $message,
        ], 400);
    }

    /**
     * Change password for authenticated user
     */
    public function changePassword(Request $request, ChangePasswordData $data): JsonResponse
    {
        app(ChangePasswordAction::class)->execute($request->user(), $data);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully',
        ]);
    }
}
