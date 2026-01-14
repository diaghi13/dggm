<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkerRateResource extends JsonResource
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
            'worker_id' => $this->worker_id,
            'rate_type' => $this->rate_type,
            'context' => $this->context,
            'rate_amount' => $this->rate_amount,
            'currency' => $this->currency,
            'project_type' => $this->project_type,
            'overtime_multiplier' => $this->overtime_multiplier,
            'holiday_multiplier' => $this->holiday_multiplier,
            'valid_from' => $this->valid_from?->format('Y-m-d'),
            'valid_to' => $this->valid_to?->format('Y-m-d'),
            'is_current' => $this->is_current,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
