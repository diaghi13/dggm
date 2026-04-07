<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\BootstrapStatus;
use App\Models\Landlord\ServiceBroadcast;
use App\Models\Tenant;
use App\Models\User as TenantUser;
use App\Notifications\ServiceBroadcastNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class DispatchServiceBroadcastJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 300;

    public function __construct(private readonly ServiceBroadcast $broadcast) {}

    public function handle(): void
    {
        try {
            // Invia a tutti i tenant correttamente inizializzati, indipendentemente dall'abbonamento.
            // Le comunicazioni di servizio (aggiornamenti, auguri, ecc.) devono raggiungere tutti.
            $tenants = Tenant::whereJsonContains('data->bootstrap_status', BootstrapStatus::Ready->value)->get();

            $totalUsers = 0;
            $totalTenants = 0;

            foreach ($tenants as $tenant) {

                try {
                    tenancy()->initialize($tenant);

                    $query = TenantUser::query();

                    if ($this->broadcast->target_roles !== null) {
                        $roles = $this->broadcast->target_roles;
                        $query->whereHas('roles', fn ($q) => $q->whereIn('name', $roles));
                    }

                    $users = $query->get();

                    foreach ($users as $user) {
                        $user->notify(new ServiceBroadcastNotification($this->broadcast));
                        $totalUsers++;
                    }

                    $totalTenants++;
                } catch (Throwable $e) {
                    Log::error('DispatchServiceBroadcastJob: failed for tenant', [
                        'tenant_id' => $tenant->id,
                        'broadcast_id' => $this->broadcast->id,
                        'error' => $e->getMessage(),
                    ]);
                } finally {
                    tenancy()->end();
                }
            }

            $this->broadcast->update([
                'status' => 'dispatched',
                'dispatched_at' => now(),
                'tenant_count' => $totalTenants,
                'user_count' => $totalUsers,
            ]);
        } catch (Throwable $e) {
            Log::error('DispatchServiceBroadcastJob: fatal error', [
                'broadcast_id' => $this->broadcast->id,
                'error' => $e->getMessage(),
            ]);

            $this->broadcast->update(['status' => 'failed']);

            throw $e;
        }
    }
}
