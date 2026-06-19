<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\ProjectWorker;
use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\TenantMembership;
use App\Models\User;
use App\Models\Worker;
use App\Models\WorkerInvitation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EnsureWorkerHasTenantAccountAction
{
    /**
     * Ensure worker has a tenant User account.
     *
     * Returns [User|null, WorkerInvitation|null]
     *
     * Case 1: Worker already has user_id → return existing User, no invitation
     * Case 2: GlobalUser exists → create tenant User + TenantMembership, assign 'worker' role
     * Case 3: No global user, email exists → create pending WorkerInvitation with project_worker metadata
     */
    public function execute(Worker $worker, ProjectWorker $projectWorker): array
    {
        // Case 1: already linked to a tenant user
        if ($worker->user_id && $worker->user) {
            return [$worker->user, null];
        }

        // Resolve GlobalUser by global_user_id or email
        $globalUser = $this->resolveGlobalUser($worker);

        if ($globalUser) {
            return [$this->addGlobalUserToTenant($globalUser, $worker), null];
        }

        // Case 3: no global user — create invitation with project_worker metadata
        if ($worker->email) {
            $invitation = $this->createPendingInvitation($worker, $projectWorker);

            return [null, $invitation];
        }

        return [null, null];
    }

    private function resolveGlobalUser(Worker $worker): ?GlobalUser
    {
        if ($worker->global_user_id) {
            return GlobalUser::find($worker->global_user_id);
        }

        if ($worker->email) {
            return GlobalUser::where('email', $worker->email)->first();
        }

        return null;
    }

    private function addGlobalUserToTenant(GlobalUser $globalUser, Worker $worker): User
    {
        // Create TenantMembership in landlord DB (Landlord models use landlord connection)
        $tenantId = tenancy()->tenant?->id;

        if ($tenantId) {
            TenantMembership::firstOrCreate(
                ['global_user_id' => $globalUser->id, 'tenant_id' => $tenantId],
                ['role' => 'worker', 'status' => 'active']
            );
        }

        return DB::transaction(function () use ($globalUser, $worker) {
            // Create (or find) the tenant-scoped User
            $user = User::firstOrCreate(
                ['email' => $globalUser->email],
                [
                    'name' => $globalUser->name,
                    'password' => $globalUser->password, // already hashed
                    'global_user_id' => $globalUser->id,
                ]
            );

            $user->assignRole('worker');

            // Link worker to the tenant user
            $worker->update([
                'user_id' => $user->id,
                'global_user_id' => $globalUser->id,
            ]);

            return $user;
        });
    }

    private function createPendingInvitation(Worker $worker, ProjectWorker $projectWorker): WorkerInvitation
    {
        return WorkerInvitation::updateOrCreate(
            ['email' => $worker->email, 'accepted_at' => null],
            [
                'first_name' => $worker->first_name,
                'last_name' => $worker->last_name,
                'phone' => $worker->phone,
                'invited_by_user_id' => auth()->id(),
                'worker_type' => $worker->worker_type,
                'contract_type' => $worker->contract_type,
                'token' => Str::random(64),
                'expires_at' => now()->addDays(7),
                'metadata' => ['project_worker_id' => $projectWorker->id],
            ]
        );
    }
}
