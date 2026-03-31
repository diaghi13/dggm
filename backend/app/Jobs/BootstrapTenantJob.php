<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\BootstrapStatus;
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
 * Attributes required on $tenant (stored in the JSON data column by stancl/tenancy):
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
        // Idempotency guard: skip if already fully bootstrapped
        if ($this->tenant->bootstrap_status === BootstrapStatus::Ready->value) {
            Log::info('BootstrapTenantJob: tenant already ready, skipping.', [
                'tenant_id' => $this->tenant->id,
            ]);

            return;
        }

        $globalUserId = $this->tenant->global_user_id;
        $companyName = $this->tenant->company_name ?? $this->tenant->name ?? '';

        // Mark as bootstrapping so the admin can see progress
        $this->tenant->update(['bootstrap_status' => BootstrapStatus::Bootstrapping->value]);

        if (! $globalUserId) {
            $this->tenant->update(['bootstrap_status' => BootstrapStatus::Failed->value]);
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

        // Mark as ready — tenant DB is fully seeded and admin user exists
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
