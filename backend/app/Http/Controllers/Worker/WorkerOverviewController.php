<?php

namespace App\Http\Controllers\Worker;

use App\Data\Landlord\GlobalUserData;
use App\Events\GlobalUserUpdated;
use App\Http\Controllers\Controller;
use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\TenantMembership;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkerOverviewController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        /** @var GlobalUser $globalUser */
        $globalUser = $request->user('global');

        $memberships = TenantMembership::where('global_user_id', $globalUser->id)
            ->where('status', 'active')
            ->get();

        $tenantsData = [];

        foreach ($memberships as $membership) {
            $tenant = Tenant::find($membership->tenant_id);
            if (! $tenant) {
                continue;
            }

            $tenantStats = $tenant->run(function () use ($globalUser) {
                $worker = \App\Models\Worker::where('global_user_id', $globalUser->id)->first();

                if (! $worker) {
                    return null;
                }

                $projectsCount = \App\Domains\Project\Models\ProjectWorker::where('worker_id', $worker->id)->count();

                return [
                    'worker_id' => $worker->id,
                    'projects_count' => $projectsCount,
                ];
            });

            $tenantsData[] = [
                'tenant_id' => $tenant->id,
                'tenant_name' => $tenant->name,
                'role' => $membership->role,
                'worker_data' => $tenantStats,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $globalUser->id,
                    'name' => $globalUser->name,
                    'email' => $globalUser->email,
                ],
                'tenants' => $tenantsData,
            ],
        ]);
    }

    public function projects(Request $request): JsonResponse
    {
        /** @var GlobalUser $globalUser */
        $globalUser = $request->user('global');

        $tenantId = $request->query('tenant_id');

        $memberships = TenantMembership::where('global_user_id', $globalUser->id)
            ->where('status', 'active')
            ->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
            ->get();

        $allProjects = [];

        foreach ($memberships as $membership) {
            $tenant = Tenant::find($membership->tenant_id);
            if (! $tenant) {
                continue;
            }

            $projects = $tenant->run(function () use ($globalUser, $tenant) {
                $worker = \App\Models\Worker::where('global_user_id', $globalUser->id)->first();

                if (! $worker) {
                    return [];
                }

                return \App\Domains\Project\Models\ProjectWorker::where('worker_id', $worker->id)
                    ->with('project:id,name,code,status,start_date,estimated_end_date,actual_end_date')
                    ->get()
                    ->map(fn ($pw) => [
                        'tenant_id' => $tenant->id,
                        'tenant_name' => $tenant->name,
                        'project' => $pw->project,
                        'site_role' => $pw->site_role,
                        'status' => $pw->status,
                    ])
                    ->toArray();
            });

            $allProjects = array_merge($allProjects, $projects);
        }

        return response()->json([
            'success' => true,
            'data' => $allProjects,
        ]);
    }

    public function profile(Request $request): JsonResponse
    {
        /** @var GlobalUser $globalUser */
        $globalUser = $request->user('global');

        return response()->json([
            'success' => true,
            'data' => GlobalUserData::fromModel($globalUser),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        /** @var GlobalUser $globalUser */
        $globalUser = $request->user('global');

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'tax_code' => ['sometimes', 'nullable', 'string', 'max:20'],
            'fiscal_code' => ['sometimes', 'nullable', 'string', 'max:20'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'province' => ['sometimes', 'nullable', 'string', 'max:5'],
            'postal_code' => ['sometimes', 'nullable', 'string', 'max:10'],
            'country' => ['sometimes', 'nullable', 'string', 'max:3'],
            'iban' => ['sometimes', 'nullable', 'string', 'max:34'],
        ]);

        $changedFields = array_keys(array_diff_assoc($validated, $globalUser->only(array_keys($validated))));

        $globalUser->update($validated);

        if (! empty($changedFields)) {
            GlobalUserUpdated::dispatch($globalUser->fresh(), $changedFields);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profilo aggiornato.',
            'data' => GlobalUserData::fromModel($globalUser->fresh()),
        ]);
    }
}
