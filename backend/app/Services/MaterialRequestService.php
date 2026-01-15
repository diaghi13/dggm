<?php

namespace App\Services;

use App\Enums\MaterialRequestStatus;
use App\Models\MaterialRequest;
use App\Models\Site;
use App\Models\User;
use App\Models\Worker;
use App\Notifications\MaterialRequestApproved;
use App\Notifications\MaterialRequested;
use App\Notifications\MaterialRequestRejected;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class MaterialRequestService
{
    /**
     * Get all material requests for a site
     */
    public function getRequestsBySite(int $siteId, array $filters = []): Collection
    {
        $query = MaterialRequest::with([
            'material',
            'requestedByWorker.user',
            'requestedByUser',
            'respondedByUser',
            'approvedByUser',
            'deliveredByUser',
        ])->where('site_id', $siteId);

        // Apply filters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        if (isset($filters['worker_id'])) {
            $query->where('requested_by_worker_id', $filters['worker_id']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get all material requests by a worker
     */
    public function getRequestsByWorker(int $workerId, array $filters = []): Collection
    {
        $query = MaterialRequest::with([
            'site',
            'material',
            'respondedByUser',
            'approvedByUser',
        ])->where('requested_by_worker_id', $workerId);

        // Apply filters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['site_id'])) {
            $query->where('site_id', $filters['site_id']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get pending requests count for a site
     */
    public function getPendingCountBySite(int $siteId): int
    {
        return MaterialRequest::where('site_id', $siteId)
            ->where('status', MaterialRequestStatus::Pending)
            ->count();
    }

    /**
     * Create a new material request
     */
    public function createRequest(array $data, int $workerId, int $userId): MaterialRequest
    {
        return DB::transaction(function () use ($data, $workerId, $userId) {
            // Verify worker is assigned to the site
            $worker = Worker::findOrFail($workerId);
            $site = Site::findOrFail($data['site_id']);

            $siteWorker = $site->workers()
                ->where('worker_id', $workerId)
                ->whereIn('status', ['accepted', 'active'])
                ->first();

            if (! $siteWorker) {
                throw new InvalidArgumentException('Il lavoratore non è assegnato a questo cantiere');
            }

            // Create request
            $request = MaterialRequest::create([
                'site_id' => $data['site_id'],
                'material_id' => $data['material_id'],
                'requested_by_worker_id' => $workerId,
                'requested_by_user_id' => $userId,
                'quantity_requested' => $data['quantity_requested'],
                'unit_of_measure' => $data['unit_of_measure'] ?? null,
                'priority' => $data['priority'] ?? 'medium',
                'reason' => $data['reason'] ?? null,
                'notes' => $data['notes'] ?? null,
                'needed_by' => $data['needed_by'] ?? null,
                'status' => MaterialRequestStatus::Pending,
            ]);

            // Notify site managers (PM, Admin, Warehouse Manager)
            $this->notifySiteManagers($request);

            return $request->load([
                'material',
                'site',
                'requestedByWorker.user',
            ]);
        });
    }

    /**
     * Approve a material request
     */
    public function approveRequest(
        int $requestId,
        int $approvedByUserId,
        ?float $quantityApproved = null,
        ?string $responseNotes = null
    ): MaterialRequest {
        return DB::transaction(function () use ($requestId, $approvedByUserId, $quantityApproved, $responseNotes) {
            $request = MaterialRequest::findOrFail($requestId);

            if (! $request->canBeApproved()) {
                throw new InvalidArgumentException('Questa richiesta non può essere approvata');
            }

            $request->update([
                'status' => MaterialRequestStatus::Approved,
                'responded_by_user_id' => $approvedByUserId,
                'responded_at' => now(),
                'approved_by_user_id' => $approvedByUserId,
                'approved_at' => now(),
                'quantity_approved' => $quantityApproved ?? $request->quantity_requested,
                'response_notes' => $responseNotes,
            ]);

            // Notify worker
            if ($request->requestedByUser) {
                $request->requestedByUser->notify(new MaterialRequestApproved($request));
            }

            return $request->fresh();
        });
    }

    /**
     * Reject a material request
     */
    public function rejectRequest(
        int $requestId,
        int $rejectedByUserId,
        ?string $rejectionReason = null
    ): MaterialRequest {
        return DB::transaction(function () use ($requestId, $rejectedByUserId, $rejectionReason) {
            $request = MaterialRequest::findOrFail($requestId);

            if (! $request->canBeRejected()) {
                throw new InvalidArgumentException('Questa richiesta non può essere rifiutata');
            }

            $request->update([
                'status' => MaterialRequestStatus::Rejected,
                'responded_by_user_id' => $rejectedByUserId,
                'responded_at' => now(),
                'rejection_reason' => $rejectionReason,
            ]);

            // Notify worker
            if ($request->requestedByUser) {
                $request->requestedByUser->notify(new MaterialRequestRejected($request));
            }

            return $request->fresh();
        });
    }

    /**
     * Mark request as delivered
     */
    public function markAsDelivered(
        int $requestId,
        int $deliveredByUserId,
        ?float $quantityDelivered = null
    ): MaterialRequest {
        return DB::transaction(function () use ($requestId, $deliveredByUserId, $quantityDelivered) {
            $request = MaterialRequest::findOrFail($requestId);

            if (! $request->canBeDelivered()) {
                throw new InvalidArgumentException('Questa richiesta non può essere contrassegnata come consegnata');
            }

            $request->update([
                'status' => MaterialRequestStatus::Delivered,
                'delivered_by_user_id' => $deliveredByUserId,
                'delivered_at' => now(),
                'quantity_delivered' => $quantityDelivered ?? $request->quantity_approved,
            ]);

            return $request->fresh();
        });
    }

    /**
     * Update request details (only if pending)
     */
    public function updateRequest(int $requestId, array $data, int $userId): MaterialRequest
    {
        $request = MaterialRequest::findOrFail($requestId);

        // Only the requester can update, and only if pending
        if ($request->requested_by_user_id !== $userId) {
            throw new InvalidArgumentException('Non hai i permessi per modificare questa richiesta');
        }

        if (! $request->isPending()) {
            throw new InvalidArgumentException('Puoi modificare solo richieste in attesa');
        }

        $request->update([
            'quantity_requested' => $data['quantity_requested'] ?? $request->quantity_requested,
            'priority' => $data['priority'] ?? $request->priority,
            'reason' => $data['reason'] ?? $request->reason,
            'notes' => $data['notes'] ?? $request->notes,
            'needed_by' => $data['needed_by'] ?? $request->needed_by,
        ]);

        return $request->fresh();
    }

    /**
     * Delete a request (only if pending)
     */
    public function deleteRequest(int $requestId, int $userId): bool
    {
        $request = MaterialRequest::findOrFail($requestId);

        // Only the requester or managers can delete
        if ($request->requested_by_user_id !== $userId) {
            $user = User::findOrFail($userId);
            if (! $user->hasAnyRole(['SuperAdmin', 'Admin', 'ProjectManager', 'WarehouseManager'])) {
                throw new InvalidArgumentException('Non hai i permessi per eliminare questa richiesta');
            }
        }

        if (! $request->isPending()) {
            throw new InvalidArgumentException('Puoi eliminare solo richieste in attesa');
        }

        return $request->delete();
    }

    /**
     * Notify site managers about new request
     */
    protected function notifySiteManagers(MaterialRequest $request): void
    {
        $site = $request->site;

        // Get site manager (Project Manager assigned to site)
        $managers = collect();

        // Add site's project manager if exists
        if ($site->project_manager_id) {
            $pm = User::find($site->project_manager_id);
            if ($pm) {
                $managers->push($pm);
            }
        }

        // Add all users with PM, Admin, or Warehouse Manager roles
        $adminUsers = User::role(['SuperAdmin', 'Admin', 'ProjectManager', 'WarehouseManager'])->get();
        $managers = $managers->merge($adminUsers)->unique('id');

        // Send notifications
        foreach ($managers as $manager) {
            $manager->notify(new MaterialRequested($request));
        }
    }

    /**
     * Get statistics for a site
     */
    public function getStatsBySite(int $siteId): array
    {
        $requests = MaterialRequest::where('site_id', $siteId)->get();

        return [
            'total' => $requests->count(),
            'pending' => $requests->where('status', MaterialRequestStatus::Pending)->count(),
            'approved' => $requests->where('status', MaterialRequestStatus::Approved)->count(),
            'rejected' => $requests->where('status', MaterialRequestStatus::Rejected)->count(),
            'delivered' => $requests->where('status', MaterialRequestStatus::Delivered)->count(),
            'urgent' => $requests->where('priority', 'urgent')->count(),
        ];
    }
}
