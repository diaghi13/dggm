<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Landlord\GlobalUser;
use App\Models\Tenant;
use Database\Seeders\TenantSeeder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class CreateTenantJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $globalUserId,
        public readonly string $companyName = '',
    ) {}

    public function handle(): void
    {
        $tenant = Tenant::findOrFail($this->tenantId);

        // The TenancyServiceProvider is configured to automatically run CreateDatabase
        // and MigrateDatabase via JobPipeline on TenantCreated event (synchronously).
        // So by the time this job runs, the DB already exists and migrations are done.
        // We only need to run the TenantSeeder and create the admin user.

        $tenant->run(function () {
            $seeder = new TenantSeeder($this->companyName);
            $seeder->run();
        });

        $globalUser = GlobalUser::findOrFail($this->globalUserId);

        $tenant->run(function () use ($globalUser) {
            $user = \App\Models\User::where('email', $globalUser->email)->first();
            if (! $user) {
                $user = new \App\Models\User;
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
            'tenant_id' => $this->tenantId,
            'global_user_id' => $this->globalUserId,
        ]);
    }

    public function failed(Throwable $exception): void
    {
        Log::error('CreateTenantJob failed', [
            'tenant_id' => $this->tenantId,
            'global_user_id' => $this->globalUserId,
            'error' => $exception->getMessage(),
        ]);
    }
}
