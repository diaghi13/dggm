<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $canViewPayroll = $request->user()?->can('workers.view-payroll');

        return [
            'id' => $this->id,
            'code' => $this->code,
            'worker_type' => $this->worker_type,
            'contract_type' => $this->contract_type,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'display_name' => $this->display_name,
            'tax_code' => $this->tax_code,
            'vat_number' => $this->vat_number,
            'email' => $this->email,
            'phone' => $this->phone,
            'mobile' => $this->mobile,
            'hire_date' => $this->hire_date?->format('Y-m-d'),
            'termination_date' => $this->termination_date?->format('Y-m-d'),
            'job_title' => $this->job_title,
            'specializations' => $this->specializations,
            'is_active' => $this->is_active,
            'has_safety_training' => $this->has_safety_training,
            'safety_training_valid' => $this->safety_training_valid,
            'contractor_company' => $this->whenLoaded('contractorCompany'),
            'user' => $this->whenLoaded('user'),
            'payroll_data' => $this->when($canViewPayroll, $this->whenLoaded('payrollData')),
            'rates' => $this->whenLoaded('rates'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
