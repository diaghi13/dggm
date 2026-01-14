<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractorRateResource extends JsonResource
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
            'contractor_id' => $this->contractor_id,
            'service_type' => $this->service_type,
            'rate_type' => $this->rate_type,
            'rate_amount' => $this->rate_amount,
            'currency' => $this->currency,
            'minimum_hours' => $this->minimum_hours,
            'minimum_amount' => $this->minimum_amount,
            'valid_from' => $this->valid_from?->format('Y-m-d'),
            'valid_to' => $this->valid_to?->format('Y-m-d'),
            'is_current' => $this->is_current,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
