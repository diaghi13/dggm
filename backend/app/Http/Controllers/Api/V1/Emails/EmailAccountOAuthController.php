<?php

namespace App\Http\Controllers\Api\V1\Emails;

use App\Http\Controllers\Controller;
use App\Models\EmailAccount;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class EmailAccountOAuthController extends Controller
{
    /**
     * Generate the OAuth authorization URL and return it to the frontend.
     * Requires auth:sanctum — X-Tenant header is present.
     */
    public function redirect(Request $request, string $provider): JsonResponse
    {
        $this->validateProvider($provider);

        // Encode tenant_id + user_id into the state so we can recover the context in the callback
        $state = Crypt::encryptString(json_encode([
            'tenant_id' => tenant('id'),
            'user_id' => auth()->id(),
            'provider' => $provider,
            'ts' => now()->timestamp,
        ]));

        $extra = ['state' => $state];

        // Google richiede access_type=offline + prompt=consent per ottenere il refresh_token
        if (in_array($provider, ['google', 'gmail'])) {
            $extra['access_type'] = 'offline';
            $extra['prompt'] = 'consent';
        }

        $url = Socialite::driver($this->mapProvider($provider))
            ->stateless()
            ->with($extra)
            ->scopes($this->scopesFor($provider))
            ->redirect()
            ->getTargetUrl();

        return response()->json([
            'success' => true,
            'data' => ['url' => $url],
        ]);
    }

    /**
     * OAuth callback — no auth middleware (called by Google/Microsoft).
     * The tenant context is recovered from the encrypted state parameter.
     */
    public function callback(Request $request, string $provider): RedirectResponse
    {
        $this->validateProvider($provider);

        try {
            $state = json_decode(Crypt::decryptString($request->get('state', '')), true);

            if (! $state || ! isset($state['tenant_id'])) {
                return $this->redirectWithError('Sessione OAuth non valida.');
            }

            // Reject expired states (max 10 minutes)
            if (now()->timestamp - ($state['ts'] ?? 0) > 600) {
                return $this->redirectWithError('Sessione OAuth scaduta. Riprova.');
            }

            $tenant = Tenant::find($state['tenant_id']);
            if (! $tenant) {
                return $this->redirectWithError('Tenant non trovato.');
            }

            tenancy()->initialize($tenant);

            $socialUser = Socialite::driver($this->mapProvider($provider))
                ->stateless()
                ->user();

            // Store the canonical frontend provider name (e.g. 'gmail' not 'google')
            $canonicalProvider = $this->canonicalProvider($provider);

            $account = EmailAccount::updateOrCreate(
                [
                    'provider' => $canonicalProvider,
                    'from_email' => $socialUser->getEmail(),
                ],
                [
                    'name' => $socialUser->getName() ?? $socialUser->getEmail(),
                    'from_name' => $socialUser->getName() ?? $socialUser->getEmail(),
                    'oauth_access_token' => $socialUser->token,
                    'oauth_refresh_token' => $socialUser->refreshToken,
                    'oauth_token_expires_at' => $socialUser->expiresIn
                        ? now()->addSeconds($socialUser->expiresIn)
                        : null,
                    'is_active' => true,
                ]
            );

            tenancy()->end();

            $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000'));

            return redirect("{$frontendUrl}/admin/settings?tab=email&oauth=success&account_id={$account->id}");

        } catch (\Throwable $e) {
            Log::error('OAuth callback error', ['error' => $e->getMessage(), 'provider' => $provider]);

            return $this->redirectWithError('Errore durante la connessione OAuth.');
        }
    }

    private function validateProvider(string $provider): void
    {
        abort_unless(in_array($provider, ['google', 'gmail', 'microsoft', 'outlook']), 404, 'Provider non supportato.');
    }

    /** Maps driver name back to canonical frontend provider name. */
    private function canonicalProvider(string $provider): string
    {
        return match ($provider) {
            'google', 'gmail' => 'gmail',
            'microsoft', 'outlook' => 'outlook',
            default => $provider,
        };
    }

    private function mapProvider(string $provider): string
    {
        return match ($provider) {
            'google', 'gmail' => 'google',
            'microsoft', 'outlook' => 'microsoft',
            default => $provider,
        };
    }

    private function scopesFor(string $provider): array
    {
        return match (true) {
            in_array($provider, ['google', 'gmail']) => ['https://mail.google.com/'],
            in_array($provider, ['microsoft', 'outlook']) => ['https://outlook.office.com/SMTP.Send', 'offline_access', 'openid', 'profile', 'email'],
            default => [],
        };
    }

    private function redirectWithError(string $message): RedirectResponse
    {
        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000'));

        return redirect("{$frontendUrl}/admin/settings?tab=email&oauth=error&message=".urlencode($message));
    }
}
