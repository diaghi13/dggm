<?php

namespace App\Services;

use App\Models\EmailAccount;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OAuthTokenRefreshService
{
    /**
     * Rinnova il token se scaduto o in scadenza entro $bufferSeconds.
     * Ritorna true se il token è valido (rinnovato o non ancora scaduto).
     */
    public function ensureFreshToken(EmailAccount $account, int $bufferSeconds = 300): bool
    {
        // Non è un account OAuth — non serve refresh
        if (! in_array($account->provider, ['google', 'gmail', 'microsoft', 'outlook'])) {
            return true;
        }

        // Token non scaduto e non in scadenza imminente
        if ($account->oauth_token_expires_at?->isAfter(now()->addSeconds($bufferSeconds))) {
            return true;
        }

        // Nessun refresh token — non possiamo rinnovare
        if (empty($account->oauth_refresh_token)) {
            return false;
        }

        return $this->refresh($account);
    }

    public function refresh(EmailAccount $account): bool
    {
        try {
            $tokens = match (true) {
                in_array($account->provider, ['google', 'gmail']) => $this->refreshGoogle($account),
                in_array($account->provider, ['microsoft', 'outlook']) => $this->refreshMicrosoft($account),
                default => null,
            };

            if (! $tokens) {
                return false;
            }

            $account->update([
                'oauth_access_token' => $tokens['access_token'],
                'oauth_token_expires_at' => now()->addSeconds($tokens['expires_in'] ?? 3600),
            ]);

            return true;

        } catch (\Throwable $e) {
            Log::warning('OAuth token refresh failed', [
                'account_id' => $account->id,
                'provider' => $account->provider,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    private function refreshGoogle(EmailAccount $account): ?array
    {
        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'refresh_token' => $account->oauth_refresh_token,
            'grant_type' => 'refresh_token',
        ]);

        if (! $response->successful()) {
            Log::warning('Google token refresh failed', ['response' => $response->body()]);

            return null;
        }

        return $response->json();
    }

    private function refreshMicrosoft(EmailAccount $account): ?array
    {
        $tenantId = config('services.microsoft.tenant', 'common');

        $response = Http::asForm()->post("https://login.microsoftonline.com/{$tenantId}/oauth2/v2.0/token", [
            'client_id' => config('services.microsoft.client_id'),
            'client_secret' => config('services.microsoft.client_secret'),
            'refresh_token' => $account->oauth_refresh_token,
            'grant_type' => 'refresh_token',
            'scope' => 'https://outlook.office.com/SMTP.Send offline_access',
        ]);

        if (! $response->successful()) {
            Log::warning('Microsoft token refresh failed', ['response' => $response->body()]);

            return null;
        }

        return $response->json();
    }
}
