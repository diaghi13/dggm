<?php

declare(strict_types=1);

namespace App\Http\Controllers\Landlord;

use App\Actions\Subscription\ApproveAddonAction;
use App\Actions\Subscription\ApprovePlanChangeAction;
use App\Actions\Subscription\ApproveRenewalAction;
use App\Http\Controllers\Controller;
use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\RenewalRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Stancl\Tenancy\Database\Models\Tenant;

class LandlordRenewalRequestController extends Controller
{
    private static array $featureNames = [
        'customers' => 'Clienti',
        'suppliers' => 'Fornitori',
        'quotes' => 'Preventivi',
        'projects' => 'Cantieri',
        'warehouse' => 'Magazzino',
        'workers' => 'Personale',
        'rental' => 'Noleggio',
        'invoicing' => 'Fatturazione',
        'reports' => 'Report',
        'time_tracking' => 'Rilevazione presenze',
    ];

    private function enrichRequest(RenewalRequest $req, Collection $tenantsByKey): array
    {
        $tenant = $tenantsByKey->get($req->tenant_id);
        $plan = $req->tenantSubscription?->plan;
        $targetPlan = $req->targetPlan ?? null;

        $type = $req->type;
        $addons = [];

        if ($type === 'renewal' || $type === 'renewal_with_addons') {
            // Show all plan-included features (price = null or 0) as the features being renewed
            $planFeatures = $plan?->features ?? collect();
            foreach ($planFeatures as $feature) {
                if (is_null($feature->price) || (float) $feature->price === 0.0) {
                    $key = $feature->feature_key;
                    $addons[] = [
                        'feature_key' => $key,
                        'label' => self::$featureNames[$key] ?? str($key)->replace('_', ' ')->title()->toString(),
                        'price' => null,
                        'price_prorated' => null,
                    ];
                }
            }

            // For renewal_with_addons, also append explicitly requested addon keys (paid addons)
            foreach ($req->addons ?? [] as $key) {
                // Avoid duplicates with plan-included features already added above
                $alreadyAdded = collect($addons)->pluck('feature_key')->contains($key);
                if (! $alreadyAdded) {
                    $addons[] = [
                        'feature_key' => $key,
                        'label' => self::$featureNames[$key] ?? str($key)->replace('_', ' ')->title()->toString(),
                        'price' => null,
                        'price_prorated' => $req->prorated_amount,
                    ];
                }
            }
        } elseif ($type === 'addon_add') {
            // Only explicitly requested addon keys
            $addons = collect($req->addons ?? [])->map(fn ($key) => [
                'feature_key' => $key,
                'label' => self::$featureNames[$key] ?? str($key)->replace('_', ' ')->title()->toString(),
                'price' => null,
                'price_prorated' => $req->prorated_amount,
            ])->values()->toArray();
        }
        // For upgrade/downgrade: no addons list (empty)

        return [
            'id' => $req->id,
            'tenant_id' => $req->tenant_id,
            'tenant_name' => $tenant?->name ?? $req->tenant_id,
            'type' => $req->type,
            'plan_name' => $plan?->name,
            'target_plan_name' => $targetPlan?->name,
            'addons' => $addons,
            'prorated_amount' => $req->prorated_amount ? (float) $req->prorated_amount : null,
            'status' => $req->status,
            'notes' => $req->notes,
            'admin_notes' => $req->admin_notes,
            'created_at' => $req->created_at?->toISOString(),
            'processed_at' => $req->processed_at?->toISOString(),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $query = RenewalRequest::query()
            ->with(['tenantSubscription.plan.features', 'targetPlan'])
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->when($request->tenant_id, fn ($q, $tenantId) => $q->where('tenant_id', $tenantId))
            ->when($request->type, fn ($q, $type) => $q->where('type', $type))
            ->orderBy('created_at', 'desc');

        $requests = $query->paginate(20);

        $tenantIds = collect($requests->items())->pluck('tenant_id')->unique()->values()->toArray();
        $tenantsByKey = Tenant::whereIn('id', $tenantIds)->get()->keyBy('id');

        $data = collect($requests->items())->map(fn ($req) => $this->enrichRequest($req, $tenantsByKey));

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'current_page' => $requests->currentPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
                'last_page' => $requests->lastPage(),
            ],
        ]);
    }

    public function show(RenewalRequest $renewalRequest): JsonResponse
    {
        $renewalRequest->loadMissing(['tenantSubscription.plan.features', 'targetPlan']);
        $tenant = Tenant::find($renewalRequest->tenant_id);
        $tenantsByKey = collect([$renewalRequest->tenant_id => $tenant]);

        return response()->json([
            'success' => true,
            'data' => $this->enrichRequest($renewalRequest, $tenantsByKey),
        ]);
    }

    public function approve(Request $request, RenewalRequest $renewalRequest): JsonResponse
    {
        $validated = $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        /** @var GlobalUser $adminUser */
        $adminUser = $request->user('global');

        if ($renewalRequest->isAddonRequest()) {
            app(ApproveAddonAction::class)->execute(
                renewalRequest: $renewalRequest,
                approvedBy: $adminUser,
                adminNotes: $validated['admin_notes'] ?? null,
            );
        } elseif ($renewalRequest->isPlanChangeRequest()) {
            app(ApprovePlanChangeAction::class)->execute(
                renewalRequest: $renewalRequest,
                approvedBy: $adminUser,
                adminNotes: $validated['admin_notes'] ?? null,
            );
        } else {
            app(ApproveRenewalAction::class)->execute(
                renewalRequest: $renewalRequest,
                approvedBy: $adminUser,
                adminNotes: $validated['admin_notes'] ?? null,
            );
        }

        $fresh = $renewalRequest->fresh(['tenantSubscription.plan.features', 'targetPlan']);
        $tenant = Tenant::find($fresh->tenant_id);

        return response()->json([
            'success' => true,
            'data' => $this->enrichRequest($fresh, collect([$fresh->tenant_id => $tenant])),
            'message' => 'Richiesta approvata con successo.',
        ]);
    }

    public function reject(Request $request, RenewalRequest $renewalRequest): JsonResponse
    {
        $validated = $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        /** @var GlobalUser $adminUser */
        $adminUser = $request->user('global');

        $renewalRequest->update([
            'status' => 'rejected',
            'admin_notes' => $validated['admin_notes'] ?? null,
            'processed_at' => now(),
            'processed_by_global_user_id' => $adminUser->id,
        ]);

        $fresh = $renewalRequest->fresh(['tenantSubscription.plan.features', 'targetPlan']);
        $tenant = Tenant::find($fresh->tenant_id);

        return response()->json([
            'success' => true,
            'data' => $this->enrichRequest($fresh, collect([$fresh->tenant_id => $tenant])),
            'message' => 'Richiesta rifiutata.',
        ]);
    }

    public function pendingCount(): JsonResponse
    {
        $count = RenewalRequest::where('status', 'pending')->count();

        return response()->json([
            'success' => true,
            'data' => ['count' => $count],
        ]);
    }
}
