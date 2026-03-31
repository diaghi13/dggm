<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Landlord\GlobalUser;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\TenantSeeder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Pipeline job — runs after CreateDatabase + MigrateDatabase.
 * Seeds the tenant DB and creates the admin user.
 *
 * Data required in $tenant->data:
 *   - global_user_id (string UUID)
 *   - company_name   (string, optional — falls back to $tenant->name)
 */
class BootstrapTenantJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(public readonly Tenant $tenant) {}

    public function handle(): void
    {
        $data = $this->tenant->data ?? [];
        $globalUserId = $data['global_user_id'] ?? null;
        $companyName = $data['company_name'] ?? $this->tenant->name ?? '';

        if (! $globalUserId) {
            Log::warning('BootstrapTenantJob: missing global_user_id in tenant data', [
                'tenant_id' => $this->tenant->id,
            ]);

            return;
        }

        $globalUser = GlobalUser::findOrFail($globalUserId);

        $this->tenant->run(function () use ($companyName) {
            (new TenantSeeder($companyName))->run();
        });

        $this->tenant->run(function () use ($globalUser) {
            $user = User::where('email', $globalUser->email)->first();

            if (! $user) {
                $user = new User;
                $user->name = $globalUser->name;
                $user->email = $globalUser->email;
                $user->global_user_id = $globalUser->id;
                // Bypass the 'hashed' cast — password is already bcrypt-hashed in GlobalUser
                $user->setRawAttributes(array_merge($user->getAttributes(), [
                    'password' => $globalUser->getRawOriginal('password'),
                ]));
                $user->save();
            }

            $user->assignRole('admin');
        });

        Log::info('Tenant bootstrapped successfully', [
            'tenant_id' => $this->tenant->id,
            'global_user_id' => $globalUserId,
        ]);
    }

    public function failed(Throwable $exception): void
    {
        Log::error('BootstrapTenantJob failed', [
            'tenant_id' => $this->tenant->id,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}
