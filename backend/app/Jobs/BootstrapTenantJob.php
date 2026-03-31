<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\BootstrapStatus;
use App\Models\Landlord\GlobalUser;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Pipeline job — runs after CreateDatabase + MigrateDatabase + SeedDatabase.
 * Creates the admin user from the linked GlobalUser and marks tenant as ready.
 *
 * Attributes required on $tenant (stored in the JSON data column by stancl/tenancy):
 *   - global_user_id (string UUID)
 */
class BootstrapTenantJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(public readonly Tenant $tenant) {}

    public function handle(): void
    {
        // Idempotency guard: skip if already fully bootstrapped
        if ($this->tenant->bootstrap_status === BootstrapStatus::Ready->value) {
            Log::info('BootstrapTenantJob: tenant already ready, skipping.', [
                'tenant_id' => $this->tenant->id,
            ]);

            return;
        }

        $this->tenant->update(['bootstrap_status' => BootstrapStatus::Bootstrapping->value]);

        $globalUserId = $this->tenant->global_user_id;

        if (! $globalUserId) {
            $this->tenant->update(['bootstrap_status' => BootstrapStatus::Failed->value]);
            Log::warning('BootstrapTenantJob: missing global_user_id in tenant data', [
                'tenant_id' => $this->tenant->id,
            ]);

            return;
        }

        $globalUser = GlobalUser::findOrFail($globalUserId);

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

        $this->tenant->update(['bootstrap_status' => BootstrapStatus::Ready->value]);

        Log::info('Tenant bootstrapped successfully', [
            'tenant_id' => $this->tenant->id,
            'global_user_id' => $globalUserId,
        ]);
    }

    public function failed(Throwable $exception): void
    {
        $this->tenant->update(['bootstrap_status' => BootstrapStatus::Failed->value]);

        Log::error('BootstrapTenantJob failed', [
            'tenant_id' => $this->tenant->id,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}
