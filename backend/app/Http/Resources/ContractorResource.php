<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractorResource extends JsonResource
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
            'code' => $this->code,
            'company_name' => $this->company_name,
            'vat_number' => $this->vat_number,
            'tax_code' => $this->tax_code,
            'contractor_type' => $this->contractor_type,
            'email' => $this->email,
            'phone' => $this->phone,
            'website' => $this->website,
            'address' => $this->address,
            'city' => $this->city,
            'province' => $this->province,
            'postal_code' => $this->postal_code,
            'country' => $this->country,
            'contact_person' => $this->contact_person,
            'contact_email' => $this->contact_email,
            'contact_phone' => $this->contact_phone,
            'iban' => $this->iban,
            'bank_name' => $this->bank_name,
            'payment_terms' => $this->payment_terms,
            'specializations' => $this->specializations,
            'notes' => $this->notes,
            'is_active' => $this->is_active,
            'active_workers_count' => $this->active_workers_count,
            'total_invoiced' => $this->total_invoiced,
            'pending_invoices_amount' => $this->pending_invoices_amount,
            'rates' => $this->whenLoaded('rates'),
            'workers' => $this->whenLoaded('workers'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
