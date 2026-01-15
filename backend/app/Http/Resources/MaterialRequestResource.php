<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaterialRequestResource extends JsonResource
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
            'site' => $this->whenLoaded('site', fn () => [
                'id' => $this->site->id,
                'name' => $this->site->name,
                'code' => $this->site->code,
            ]),
            'material_id' => $this->material_id,
            'material' => $this->whenLoaded('material', fn () => [
                'id' => $this->material->id,
                'name' => $this->material->name,
                'code' => $this->material->code,
                'unit_of_measure' => $this->material->unit_of_measure,
            ]),
            'requested_by_worker_id' => $this->requested_by_worker_id,
            'requested_by_worker' => $this->whenLoaded('requestedByWorker', fn () => [
                'id' => $this->requestedByWorker->id,
                'full_name' => $this->requestedByWorker->full_name,
                'user' => $this->whenLoaded('requestedByWorker.user', fn () => [
                    'id' => $this->requestedByWorker->user->id,
                    'name' => $this->requestedByWorker->user->name,
                    'email' => $this->requestedByWorker->user->email,
                ]),
            ]),
            'requested_by_user_id' => $this->requested_by_user_id,
            'requested_by_user' => $this->whenLoaded('requestedByUser', fn () => [
                'id' => $this->requestedByUser->id,
                'name' => $this->requestedByUser->name,
            ]),
            'quantity_requested' => (float) $this->quantity_requested,
            'unit_of_measure' => $this->unit_of_measure,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'priority' => $this->priority->value,
            'priority_label' => $this->priority->label(),
            'reason' => $this->reason,
            'notes' => $this->notes,
            'needed_by' => $this->needed_by?->format('Y-m-d'),
            'responded_by_user_id' => $this->responded_by_user_id,
            'responded_by_user' => $this->whenLoaded('respondedByUser', fn () => [
                'id' => $this->respondedByUser->id,
                'name' => $this->respondedByUser->name,
            ]),
            'responded_at' => $this->responded_at?->toIso8601String(),
            'response_notes' => $this->response_notes,
            'rejection_reason' => $this->rejection_reason,
            'quantity_approved' => $this->quantity_approved ? (float) $this->quantity_approved : null,
            'approved_by_user_id' => $this->approved_by_user_id,
            'approved_by_user' => $this->whenLoaded('approvedByUser', fn () => [
                'id' => $this->approvedByUser->id,
                'name' => $this->approvedByUser->name,
            ]),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'quantity_delivered' => $this->quantity_delivered ? (float) $this->quantity_delivered : null,
            'delivered_at' => $this->delivered_at?->toIso8601String(),
            'delivered_by_user_id' => $this->delivered_by_user_id,
            'delivered_by_user' => $this->whenLoaded('deliveredByUser', fn () => [
                'id' => $this->deliveredByUser->id,
                'name' => $this->deliveredByUser->name,
            ]),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
            'can_approve' => $this->canBeApproved(),
            'can_reject' => $this->canBeRejected(),
            'can_deliver' => $this->canBeDelivered(),
        ];
    }
}
