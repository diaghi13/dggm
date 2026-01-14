<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SiteWorkerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'site_id' => $this->site_id,
            'worker_id' => $this->worker_id,
            'status' => $this->status->value,
            'status_label' => $this->getStatusLabel(),

            // Dates
            'assigned_from' => $this->assigned_from?->format('Y-m-d'),
            'assigned_to' => $this->assigned_to?->format('Y-m-d'),
            'responded_at' => $this->responded_at?->toIso8601String(),
            'response_due_at' => $this->response_due_at?->toIso8601String(),

            // Rate overrides
            'hourly_rate_override' => $this->hourly_rate_override ? (float) $this->hourly_rate_override : null,
            'fixed_rate_override' => $this->fixed_rate_override ? (float) $this->fixed_rate_override : null,
            'rate_override_notes' => $this->rate_override_notes,

            // Estimates
            'estimated_hours' => $this->estimated_hours ? (float) $this->estimated_hours : null,

            // Notes
            'notes' => $this->notes,
            'rejection_reason' => $this->rejection_reason,

            // Status flags
            'is_active' => $this->is_active,
            'is_currently_active' => $this->is_currently_active,
            'is_pending' => $this->status->value === 'pending',
            'can_respond' => $this->status->value === 'pending',

            // Duration
            'duration_days' => $this->duration_days,

            // Relationships
            'site' => $this->whenLoaded('site', function () {
                return [
                    'id' => $this->site->id,
                    'code' => $this->site->code,
                    'name' => $this->site->name,
                    'status' => $this->site->status,
                ];
            }),

            'worker' => $this->whenLoaded('worker', fn () => new WorkerResource($this->worker)),

            'assigned_by' => $this->whenLoaded('assignedBy', function () {
                return [
                    'id' => $this->assignedBy->id,
                    'name' => $this->assignedBy->name,
                    'email' => $this->assignedBy->email,
                ];
            }),

            'roles' => SiteRoleResource::collection($this->whenLoaded('roles')),

            // Timestamps
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Get human-readable status label
     */
    private function getStatusLabel(): string
    {
        return match ($this->status->value) {
            'pending' => 'In Attesa',
            'accepted' => 'Accettato',
            'rejected' => 'Rifiutato',
            'active' => 'Attivo',
            'completed' => 'Completato',
            'cancelled' => 'Annullato',
            default => 'Sconosciuto',
        };
    }
}
