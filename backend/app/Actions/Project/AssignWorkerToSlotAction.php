<?php

namespace App\Actions\Project;

use App\Enums\ProjectWorkerStatus;
use App\Enums\RateContext;
use App\Enums\RateType;
use App\Enums\WorkerType;
use App\Models\ProjectWorker;
use App\Models\Worker;
use App\Services\RateCalculationService;
use Illuminate\Support\Facades\DB;

class AssignWorkerToSlotAction
{
    public function __construct(
        private readonly RateCalculationService $rateService
    ) {}

    public function execute(ProjectWorker $slot, Worker $worker, array $data = [], ?float $actualCostRateOverride = null): ProjectWorker
    {
        return DB::transaction(function () use ($slot, $worker, $data, $actualCostRateOverride) {
            $isExternal = $worker->worker_type === WorkerType::External;

            // Determine initial status
            $status = $isExternal
                ? ProjectWorkerStatus::Pending
                : ProjectWorkerStatus::Active;

            // Use the PM-provided override if given, otherwise auto-detect from WorkerRate
            if ($actualCostRateOverride !== null) {
                $actualCostRate = $actualCostRateOverride;
            } else {
                $actualCostRate = null;
                try {
                    $rate = $this->rateService->getCurrentRate(
                        $worker,
                        RateContext::InternalCost,
                        RateType::Hourly,
                    );
                    $actualCostRate = $rate?->rate_amount;
                } catch (\Throwable) {
                    // No rate configured — leave null, PM can fill manually
                }
            }

            $slot->update([
                'worker_id' => $worker->id,
                'status' => $status,
                'is_external' => $isExternal,
                'actual_cost_rate' => $actualCostRate,
                'assigned_from' => $data['assigned_from'] ?? null,
                'assigned_to' => $data['assigned_to'] ?? null,
                'notes' => $data['notes'] ?? $slot->notes,
                'response_due_at' => $status === ProjectWorkerStatus::Pending
                    ? now()->addDays(3)
                    : null,
            ]);

            // Ensure the worker has a tenant account (or create an invitation)
            [$user, $invitation] = app(EnsureWorkerHasTenantAccountAction::class)->execute($worker, $slot);

            if ($user) {
                // Worker has account → send assignment notification (choose days)
                app(NotifyWorkerAssignmentAction::class)->execute($slot, $user);
            } elseif ($invitation) {
                // New worker with no account → send project-specific invitation email
                app(SendProjectInvitationEmailAction::class)->execute($invitation, $slot);
            }

            return $slot->fresh()->load(['worker.user', 'project', 'assignedBy']);
        });
    }
}
