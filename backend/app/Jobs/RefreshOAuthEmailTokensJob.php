<?php

namespace App\Jobs;

use App\Models\EmailAccount;
use App\Models\Tenant;
use App\Services\OAuthTokenRefreshService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RefreshOAuthEmailTokensJob implements ShouldQueue
{
    use Queueable;

    public function handle(OAuthTokenRefreshService $refreshService): void
    {
        Tenant::all()->each(function (Tenant $tenant) use ($refreshService) {
            tenancy()->initialize($tenant);

            EmailAccount::where('is_active', true)
                ->whereIn('provider', ['google', 'gmail', 'microsoft', 'outlook'])
                ->whereNotNull('oauth_refresh_token')
                ->where(function ($q) {
                    $q->whereNull('oauth_token_expires_at')
                        ->orWhere('oauth_token_expires_at', '<', now()->addMinutes(30));
                })
                ->each(fn (EmailAccount $account) => $refreshService->refresh($account));

            tenancy()->end();
        });
    }
}
