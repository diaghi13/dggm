<?php

namespace App\Services;

use App\Enums\SiteWorkerStatus;
use App\Enums\WorkerType;
use App\Models\Site;
use App\Models\SiteWorker;
use App\Models\User;
use App\Models\Worker;
use App\Notifications\AssignmentRespondedByWorker;
use App\Notifications\WorkerAssignedToSite;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class SiteWorkerService
{
    /**
     * Get all workers assigned to a site
     */
    public function getWorkersBySite(int $siteId, ?array $filters = []): Collection
    {
        $query = SiteWorker::query()
            ->where('site_id', $siteId)
            ->with(['worker.user', 'worker.supplier', 'assignedBy', 'roles']);

        // Filter by status
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Filter by active assignments
        if (isset($filters['is_active']) && $filters['is_active']) {
            $query->currentlyActive();
        }

        // Filter by date range
        if (isset($filters['from_date'])) {
            $query->where('assigned_to', '>=', $filters['from_date']);
        }

        if (isset($filters['to_date'])) {
            $query->where('assigned_from', '<=', $filters['to_date']);
        }

        return $query->orderBy('assigned_from')->get();
    }

    /**
     * Get all sites assigned to a worker
     */
    public function getSitesByWorker(int $workerId, ?array $filters = []): Collection
    {
        $query = SiteWorker::query()
            ->where('worker_id', $workerId)
            ->with(['site.customer', 'assignedBy', 'roles']);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['is_active']) && $filters['is_active']) {
            $query->currentlyActive();
        }

        return $query->orderBy('assigned_from', 'desc')->get();
    }

    /**
     * Assign a worker to a site
     */
    public function assignWorker(
        int $siteId,
        int $workerId,
        array $data,
        int $assignedByUserId
    ): SiteWorker {
        $site = Site::findOrFail($siteId);
        $worker = Worker::with('supplier')->findOrFail($workerId);

        // Check if worker is already assigned to this site on the same start date
        $existing = SiteWorker::where('site_id', $siteId)
            ->where('worker_id', $workerId)
            ->where('assigned_from', $data['assigned_from'])
            ->first();

        if ($existing) {
            throw new \Exception(
                "Il lavoratore {$worker->full_name} è già assegnato a questo cantiere con data inizio {$data['assigned_from']}. ".
                "Modifica l'assegnazione esistente o usa una data diversa."
            );
        }

        // Determine initial status based on worker type
        $status = $this->determineInitialStatus($worker);

        // Calculate response due date for external workers and freelancers (7 days default)
        $responseDueAt = null;
        if ($worker->worker_type === WorkerType::External || $worker->worker_type === WorkerType::Freelancer) {
            $responseDueAt = now()->addDays($data['response_days'] ?? 7);
        }

        // Create site worker assignment
        $siteWorker = DB::transaction(function () use ($site, $worker, $data, $assignedByUserId, $status, $responseDueAt) {
            $siteWorker = SiteWorker::create([
                'site_id' => $site->id,
                'worker_id' => $worker->id,
                'status' => $status,
                'assigned_by_user_id' => $assignedByUserId,
                'assigned_from' => $data['assigned_from'],
                'assigned_to' => $data['assigned_to'] ?? null,
                'hourly_rate_override' => $data['hourly_rate_override'] ?? null,
                'fixed_rate_override' => $data['fixed_rate_override'] ?? null,
                'rate_override_notes' => $data['rate_override_notes'] ?? null,
                'estimated_hours' => $data['estimated_hours'] ?? null,
                'response_due_at' => $responseDueAt,
                'notes' => $data['notes'] ?? null,
                'is_active' => true,
            ]);

            // Attach roles if provided
            if (! empty($data['role_ids'])) {
                $siteWorker->roles()->attach($data['role_ids']);
            }

            return $siteWorker->load(['worker', 'assignedBy', 'roles']);
        });

        // Send notification to worker
        if ($worker->user) {
            $worker->user->notify(new WorkerAssignedToSite($siteWorker));
        }

        return $siteWorker;
    }

    /**
     * Update a site worker assignment
     */
    public function updateAssignment(int $siteWorkerId, array $data): SiteWorker
    {
        $siteWorker = SiteWorker::findOrFail($siteWorkerId);

        DB::transaction(function () use ($siteWorker, $data) {
            $siteWorker->update([
                'assigned_from' => $data['assigned_from'] ?? $siteWorker->assigned_from,
                'assigned_to' => $data['assigned_to'] ?? $siteWorker->assigned_to,
                'hourly_rate_override' => $data['hourly_rate_override'] ?? $siteWorker->hourly_rate_override,
                'fixed_rate_override' => $data['fixed_rate_override'] ?? $siteWorker->fixed_rate_override,
                'rate_override_notes' => $data['rate_override_notes'] ?? $siteWorker->rate_override_notes,
                'estimated_hours' => $data['estimated_hours'] ?? $siteWorker->estimated_hours,
                'notes' => $data['notes'] ?? $siteWorker->notes,
            ]);

            // Sync roles if provided
            if (isset($data['role_ids'])) {
                $siteWorker->roles()->sync($data['role_ids']);
            }
        });

        return $siteWorker->fresh(['worker', 'assignedBy', 'roles']);
    }

    /**
     * Accept an assignment (by worker)
     */
    public function acceptAssignment(int $siteWorkerId, ?string $notes = null): SiteWorker
    {
        $siteWorker = SiteWorker::findOrFail($siteWorkerId);

        if ($siteWorker->status !== SiteWorkerStatus::Pending) {
            throw new \Exception('Only pending assignments can be accepted');
        }

        $siteWorker->update([
            'status' => SiteWorkerStatus::Accepted,
            'responded_at' => now(),
            'notes' => $notes ? ($siteWorker->notes."\n\nNote accettazione: ".$notes) : $siteWorker->notes,
        ]);

        // Notify PM/Admin and site managers
        $this->notifyManagers($siteWorker, true, $notes);

        return $siteWorker->fresh(['worker', 'assignedBy', 'roles']);
    }

    /**
     * Reject an assignment (by worker)
     */
    public function rejectAssignment(int $siteWorkerId, ?string $reason = null): SiteWorker
    {
        $siteWorker = SiteWorker::findOrFail($siteWorkerId);

        if ($siteWorker->status !== SiteWorkerStatus::Pending) {
            throw new \Exception('Only pending assignments can be rejected');
        }

        $siteWorker->update([
            'status' => SiteWorkerStatus::Rejected,
            'responded_at' => now(),
            'rejection_reason' => $reason,
        ]);

        // Notify PM/Admin and site managers
        $this->notifyManagers($siteWorker, false, $reason);

        return $siteWorker->fresh(['worker', 'assignedBy', 'roles']);
    }

    /**
     * Change assignment status (by PM/Admin)
     */
    public function changeStatus(int $siteWorkerId, SiteWorkerStatus $status): SiteWorker
    {
        $siteWorker = SiteWorker::findOrFail($siteWorkerId);

        $siteWorker->update([
            'status' => $status,
        ]);

        return $siteWorker->fresh(['worker', 'assignedBy', 'roles']);
    }

    /**
     * Cancel an assignment
     */
    public function cancelAssignment(int $siteWorkerId, ?string $reason = null): SiteWorker
    {
        $siteWorker = SiteWorker::findOrFail($siteWorkerId);

        $siteWorker->update([
            'status' => SiteWorkerStatus::Cancelled,
            'notes' => $reason ? ($siteWorker->notes."\n\nMotivo cancellazione: ".$reason) : $siteWorker->notes,
            'is_active' => false,
        ]);

        return $siteWorker->fresh(['worker', 'assignedBy', 'roles']);
    }

    /**
     * Complete an assignment
     */
    public function completeAssignment(int $siteWorkerId): SiteWorker
    {
        $siteWorker = SiteWorker::findOrFail($siteWorkerId);

        $siteWorker->update([
            'status' => SiteWorkerStatus::Completed,
            'assigned_to' => $siteWorker->assigned_to ?? now(),
            'is_active' => false,
        ]);

        return $siteWorker->fresh(['worker', 'assignedBy', 'roles']);
    }

    /**
     * Remove a worker from a site
     */
    public function removeWorker(int $siteWorkerId): bool
    {
        $siteWorker = SiteWorker::findOrFail($siteWorkerId);

        return $siteWorker->delete();
    }

    /**
     * Check for conflicts (worker assigned to other sites in same period)
     */
    public function checkConflicts(
        int $workerId,
        Carbon $assignedFrom,
        ?Carbon $assignedTo = null,
        ?int $excludeSiteWorkerId = null
    ): Collection {
        $query = SiteWorker::query()
            ->where('worker_id', $workerId)
            ->with(['site', 'roles'])
            ->whereIn('status', [
                SiteWorkerStatus::Pending->value,
                SiteWorkerStatus::Accepted->value,
                SiteWorkerStatus::Active->value,
            ])
            ->where(function ($q) use ($assignedFrom, $assignedTo) {
                if ($assignedTo) {
                    // Check for overlap with date range
                    $q->where(function ($subQ) use ($assignedFrom, $assignedTo) {
                        $subQ->whereBetween('assigned_from', [$assignedFrom, $assignedTo])
                            ->orWhereBetween('assigned_to', [$assignedFrom, $assignedTo])
                            ->orWhere(function ($innerQ) use ($assignedFrom, $assignedTo) {
                                $innerQ->where('assigned_from', '<=', $assignedFrom)
                                    ->where(function ($lastQ) use ($assignedTo) {
                                        $lastQ->whereNull('assigned_to')
                                            ->orWhere('assigned_to', '>=', $assignedTo);
                                    });
                            });
                    });
                } else {
                    // Check for overlap with open-ended assignment
                    $q->where(function ($subQ) use ($assignedFrom) {
                        $subQ->where('assigned_from', '<=', $assignedFrom)
                            ->where(function ($lastQ) use ($assignedFrom) {
                                $lastQ->whereNull('assigned_to')
                                    ->orWhere('assigned_to', '>=', $assignedFrom);
                            });
                    });
                }
            });

        if ($excludeSiteWorkerId) {
            $query->where('id', '!=', $excludeSiteWorkerId);
        }

        return $query->get();
    }

    /**
     * Get conflicts summary for a worker
     */
    public function getConflictsSummary(
        int $workerId,
        Carbon $assignedFrom,
        ?Carbon $assignedTo = null
    ): array {
        $conflicts = $this->checkConflicts($workerId, $assignedFrom, $assignedTo);

        return [
            'has_conflicts' => $conflicts->isNotEmpty(),
            'conflict_count' => $conflicts->count(),
            'conflicts' => $conflicts,
        ];
    }

    /**
     * Determine initial status based on worker type
     */
    private function determineInitialStatus(Worker $worker): SiteWorkerStatus
    {
        // Internal workers (employees) are directly accepted
        if ($worker->worker_type === WorkerType::Employee) {
            return SiteWorkerStatus::Accepted;
        }

        // External workers need to accept the assignment
        if ($worker->worker_type === WorkerType::External) {
            return SiteWorkerStatus::Pending;
        }

        // Freelancers need to accept the assignment (like External workers)
        return SiteWorkerStatus::Pending;
    }

    /**
     * Calculate effective rate for a worker on a site
     */
    public function calculateEffectiveRate(SiteWorker $siteWorker): ?float
    {
        // Priority: fixed_rate_override > hourly_rate_override > worker's current rate
        if ($siteWorker->fixed_rate_override) {
            return (float) $siteWorker->fixed_rate_override;
        }

        if ($siteWorker->hourly_rate_override) {
            return (float) $siteWorker->hourly_rate_override;
        }

        // Get worker's current rate (from worker_rates table)
        $worker = $siteWorker->worker;
        $currentRate = $worker->getCurrentRate('internal_cost', 'hourly');

        return $currentRate ? (float) $currentRate->rate_amount : null;
    }

    /**
     * Notify managers (PM, Admin, assigned_by user) about worker response
     */
    private function notifyManagers(SiteWorker $siteWorker, bool $wasAccepted, ?string $reason = null): void
    {
        $usersToNotify = collect();

        // Notify the user who assigned the worker
        if ($siteWorker->assignedBy) {
            $usersToNotify->push($siteWorker->assignedBy);
        }

        // Notify all ProjectManagers and Admins
        $managers = User::role(['ProjectManager', 'Admin'])->get();
        $usersToNotify = $usersToNotify->merge($managers);

        // Remove duplicates
        $usersToNotify = $usersToNotify->unique('id');

        // Send notification to each user
        foreach ($usersToNotify as $user) {
            $user->notify(new AssignmentRespondedByWorker($siteWorker, $wasAccepted, $reason));
        }
    }
}
