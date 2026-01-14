<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupplierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'company_name' => $this->company_name,
            'supplier_type' => $this->supplier_type,
            'personnel_type' => $this->personnel_type,
            'vat_number' => $this->vat_number,
            'tax_code' => $this->tax_code,
            'email' => $this->email,
            'phone' => $this->phone,
            'mobile' => $this->mobile,
            'website' => $this->website,
            'address' => $this->address,
            'city' => $this->city,
            'province' => $this->province,
            'postal_code' => $this->postal_code,
            'country' => $this->country,
            'full_address' => $this->full_address,
            'payment_terms' => $this->payment_terms,
            'delivery_terms' => $this->delivery_terms,
            'discount_percentage' => $this->discount_percentage,
            'iban' => $this->iban,
            'bank_name' => $this->bank_name,
            'contact_person' => $this->contact_person,
            'contact_email' => $this->contact_email,
            'contact_phone' => $this->contact_phone,
            'specializations' => $this->specializations,
            'notes' => $this->notes,
            'is_active' => $this->is_active,
            'provides_materials' => $this->provides_materials,
            'provides_personnel' => $this->provides_personnel,
            'active_workers_count' => $this->whenLoaded('workers', fn () => $this->active_workers_count, 0),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
