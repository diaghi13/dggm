<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SiteLaborCostResource extends JsonResource
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
            'cost_type' => $this->cost_type,
            'worker_id' => $this->worker_id,
            'contractor_id' => $this->contractor_id,
            'description' => $this->description,
            'work_date' => $this->work_date?->format('Y-m-d'),
            'hours_worked' => $this->hours_worked,
            'quantity' => $this->quantity,
            'unit_rate' => $this->unit_rate,
            'total_cost' => $this->total_cost,
            'currency' => $this->currency,
            'is_overtime' => $this->is_overtime,
            'is_holiday' => $this->is_holiday,
            'cost_category' => $this->cost_category,
            'invoice_number' => $this->invoice_number,
            'invoice_date' => $this->invoice_date?->format('Y-m-d'),
            'is_invoiced' => $this->is_invoiced,
            'notes' => $this->notes,
            'worker' => $this->whenLoaded('worker', fn () => new WorkerResource($this->worker)),
            'contractor' => $this->whenLoaded('contractor', fn () => new ContractorResource($this->contractor)),
            'site' => $this->whenLoaded('site'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
