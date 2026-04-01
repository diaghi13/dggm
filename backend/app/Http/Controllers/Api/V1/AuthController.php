<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Auth\ChangePasswordAction;
use App\Actions\Auth\ResetPasswordAction;
use App\Actions\Auth\SendPasswordResetLinkAction;
use App\Data\ChangePasswordData;
use App\Data\ForgotPasswordData;
use App\Data\Landlord\GlobalUserData;
use App\Data\ResetPasswordData;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\TenantMembership;
use App\Models\Tenant;
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
        // Authenticate against GlobalUser (landlord DB) — works without x-tenant header.
        // The legacy AuthController::login() used the tenant User model, which requires
        // tenancy context (x-tenant header) that doesn't exist at login time.
        $globalUser = GlobalUser::where('email', $request->email)->first();

        if (! $globalUser || ! Hash::check($request->password, $globalUser->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $globalUserData = GlobalUserData::fromModel($globalUser);
        $tenants = $this->getGlobalUserTenants($globalUser);
        $globalToken = $globalUser->createToken('global-web')->plainTextToken;

        // Create token name with device info for tracking
        $deviceName = $request->input('device_name', 'Unknown Device');
        $userAgent = $request->userAgent() ?? 'Unknown';
        $tokenName = sprintf('%s (%s)', $deviceName, substr($userAgent, 0, 50));

        // Try to load the tenant User and create a cookie token by switching into
        // the first active tenant's DB context (needed for httpOnly cookie auth).
        $token = null;
        $userData = null;
        $globalSettings = collect();
        $userSettings = collect();
        $featureFlags = [];

        if (! empty($tenants)) {
            // Prefer first active/trial tenant for loading user context; fall back to first in list
            $activeTenant = collect($tenants)->first(fn ($t) => in_array($t['subscription_status'], ['active', 'trial']));
            $firstTenantId = ($activeTenant ?? $tenants[0])['id'];
            $tenant = Tenant::find($firstTenantId);

            if ($tenant) {
                $tenant->run(function () use ($globalUser, $tokenName, &$token, &$userData, &$globalSettings, &$userSettings, &$featureFlags) {
                    $tenantUser = User::with('worker')->where('email', $globalUser->email)->first();

                    if ($tenantUser) {
                        $token = $tenantUser->createToken($tokenName)->plainTextToken;

                        // Eagerly resolve all tenant-DB-dependent data inside run() so that
                        // the "tenant" connection is still active. Storing a plain array avoids
                        // UserResource triggering lazy Spatie-Permission queries after tenancy
                        // has ended and the "tenant" connection has been purged.
                        $userData = (new UserResource($tenantUser))->resolve();

                        $globalSettings = \App\Models\Setting::global()
                            ->where('is_public', true)
                            ->ordered()
                            ->get()
                            ->mapWithKeys(fn ($s) => [$s->key => $s->getTypedValue()]);

                        $userSettings = \App\Models\Setting::forUser($tenantUser->id)
                            ->ordered()
                            ->get()
                            ->mapWithKeys(fn ($s) => [$s->key => $s->getTypedValue()]);

                        $featureFlags = \App\Models\Setting::where('is_feature_flag', true)
                            ->where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', $tenantUser->id))
                            ->get()
                            ->filter(fn ($s) => filter_var($s->getTypedValue(), FILTER_VALIDATE_BOOLEAN))
                            ->pluck('key')
                            ->toArray();
                    }
                });

                // Merge plan-based feature keys (landlord DB) with setting-based flags.
                // New tenants may have no feature flag settings yet; the active subscription
                // plan is the authoritative source of what is actually unlocked.
                $planFeatures = $this->getPlanFeatures($firstTenantId);
                $featureFlags = array_values(array_unique(array_merge($featureFlags, $planFeatures)));
            }
        }

        $response = response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $userData,
                'settings' => [
                    'global' => $globalSettings,
                    'user' => $userSettings,
                ],
                'features' => $featureFlags,
                'global_user' => $globalUserData,
                'tenants' => $tenants,
                'global_token' => $globalToken,
            ],
        ]);

        if ($token) {
            $response = $response->cookie(
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

        return $response;
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

        // Lookup matching GlobalUser by email to include multi-tenant identity
        $globalUser = GlobalUser::where('email', $user->email)->first();
        $globalUserData = null;
        $tenants = [];

        if ($globalUser) {
            $globalUserData = GlobalUserData::fromModel($globalUser);
            $tenants = $this->getGlobalUserTenants($globalUser);

            // Merge plan-based feature keys (from landlord DB) into the feature flags array.
            // Setting-based flags may be empty for new tenants; the plan subscription is the
            // authoritative source of what features are actually unlocked.
            $planFeatures = $this->getPlanFeatures(tenancy()->tenant?->id);
            $featureFlags = array_values(array_unique(array_merge($featureFlags, $planFeatures)));
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => new UserResource($user),
                'settings' => [
                    'global' => $globalSettings,
                    'user' => $userSettings,
                ],
                'features' => $featureFlags,
                'global_user' => $globalUserData,
                'tenants' => $tenants,
                'global_token' => null, // Token already issued at login; not re-issued on /me
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
     * Returns the feature keys enabled by the tenant's active subscription plan.
     * Reads from the landlord DB — safe to call outside tenant context.
     *
     * @return string[]
     */
    private function getPlanFeatures(?string $tenantId): array
    {
        if (! $tenantId) {
            return [];
        }

        $subscription = \App\Models\Landlord\TenantSubscription::where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->with('plan.features')
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $subscription) {
            return [];
        }

        return $subscription->plan->features
            ->pluck('feature_key')
            ->toArray();
    }

    /**
     * Returns tenant summaries for a GlobalUser.
     * Includes subscription_status so the frontend can redirect pending/suspended tenants.
     *
     * @return array<int, array{id: string, name: string, slug: string, role: string, subscription_status: string}>
     */
    private function getGlobalUserTenants(GlobalUser $globalUser): array
    {
        $memberships = TenantMembership::where('global_user_id', $globalUser->id)
            ->where('status', 'active')
            ->get();

        return $memberships->map(function (TenantMembership $membership): ?array {
            $tenant = Tenant::find($membership->tenant_id);
            if (! $tenant) {
                return null;
            }

            $subscription = \App\Models\Landlord\TenantSubscription::where('tenant_id', $tenant->id)
                ->orderBy('created_at', 'desc')
                ->first();

            return [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'role' => $membership->role,
                'subscription_status' => $subscription?->status ?? 'none',
            ];
        })->filter()->values()->all();
    }

    /**
     * Switch the active tenant for an already-authenticated user.
     *
     * The frontend sends the global_token as `Authorization: Bearer {global_token}`.
     * A new tenant-scoped Sanctum token is created inside the target tenant's DB
     * and returned as an httpOnly cookie — identical pattern to login().
     */
    public function switchTenant(Request $request): JsonResponse
    {
        $request->validate([
            'tenant_id' => ['required', 'string'],
        ]);

        // Authenticate via global guard (Bearer global_token in Authorization header)
        $globalUser = $request->user('global');

        if (! $globalUser) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        // Verify the user has an active membership in the requested tenant
        $membership = TenantMembership::where('global_user_id', $globalUser->id)
            ->where('tenant_id', $request->tenant_id)
            ->where('status', 'active')
            ->first();

        if (! $membership) {
            return response()->json(['success' => false, 'message' => 'Non sei membro di questo tenant.'], 403);
        }

        $tenant = Tenant::find($request->tenant_id);
        if (! $tenant) {
            return response()->json(['success' => false, 'message' => 'Tenant non trovato.'], 404);
        }

        $newToken = null;
        $userData = null;
        $globalSettings = collect();
        $userSettings = collect();
        $featureFlags = [];

        $tenant->run(function () use ($globalUser, $request, &$newToken, &$userData, &$globalSettings, &$userSettings, &$featureFlags) {
            $tenantUser = User::with('worker')->where('email', $globalUser->email)->first();

            if (! $tenantUser) {
                return;
            }

            $deviceName = $request->input('device_name', 'Switch');
            $userAgent = $request->userAgent() ?? 'Unknown';
            $tokenName = sprintf('%s (%s)', $deviceName, substr($userAgent, 0, 50));

            $newToken = $tenantUser->createToken($tokenName)->plainTextToken;

            $userData = (new UserResource($tenantUser))->resolve();

            $globalSettings = \App\Models\Setting::global()
                ->where('is_public', true)
                ->ordered()
                ->get()
                ->mapWithKeys(fn ($s) => [$s->key => $s->getTypedValue()]);

            $userSettings = \App\Models\Setting::forUser($tenantUser->id)
                ->ordered()
                ->get()
                ->mapWithKeys(fn ($s) => [$s->key => $s->getTypedValue()]);

            $featureFlags = \App\Models\Setting::where('is_feature_flag', true)
                ->where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', $tenantUser->id))
                ->get()
                ->filter(fn ($s) => filter_var($s->getTypedValue(), FILTER_VALIDATE_BOOLEAN))
                ->pluck('key')
                ->toArray();
        });

        if (! $newToken) {
            return response()->json([
                'success' => false,
                'message' => 'Utente non trovato nel tenant selezionato.',
            ], 404);
        }

        // Merge plan-based features (landlord DB) with setting-based flags
        $planFeatures = $this->getPlanFeatures($request->tenant_id);
        $featureFlags = array_values(array_unique(array_merge($featureFlags, $planFeatures)));

        $response = response()->json([
            'success' => true,
            'data' => [
                'user' => $userData,
                'settings' => [
                    'global' => $globalSettings,
                    'user' => $userSettings,
                ],
                'features' => $featureFlags,
            ],
        ]);

        // Set new tenant-scoped httpOnly cookie — same pattern as login()
        return $response->cookie(
            'auth_token',
            $newToken,
            60 * 24 * 30,
            config('session.path', '/'),
            config('session.domain'),
            config('session.secure', false),
            true,  // httpOnly
            false,
            config('session.same_site', 'lax')
        );
    }

    /**
     * Send password reset link to user's email
     */
    public function forgotPassword(ForgotPasswordData $data): JsonResponse
    {
        $status = app(SendPasswordResetLinkAction::class)->execute($data);

        if ($status === Password::RESET_THROTTLED) {
            return response()->json([
                'success' => false,
                'message' => 'Hai già richiesto un link di reset. Attendi qualche minuto prima di riprovare.',
            ], 429);
        }

        // Always return a generic success message for security (do not reveal if email exists)
        return response()->json([
            'success' => true,
            'message' => 'Se l\'email è registrata, riceverai un link di reset a breve.',
        ]);
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
                'message' => 'Password reimpostata con successo.',
            ]);
        }

        [$httpStatus, $message] = match ($status) {
            Password::INVALID_TOKEN => [400, 'Il link di reset non è valido o è scaduto. Richiedi un nuovo link.'],
            Password::RESET_THROTTLED => [429, 'Troppe richieste. Attendi qualche minuto prima di riprovare.'],
            Password::INVALID_USER => [400, 'Nessun account trovato con questo indirizzo email.'],
            default => [400, 'Impossibile reimpostare la password. Riprova.'],
        };

        return response()->json([
            'success' => false,
            'message' => $message,
        ], $httpStatus);
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
