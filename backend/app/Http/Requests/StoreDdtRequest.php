<?php

namespace App\Http\Requests;

use App\Enums\DdtType;
use App\Enums\ReturnReason;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDdtRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('warehouse.create');
    }

    public function rules(): array
    {
        return [
            'code' => 'nullable|string|max:50|unique:ddts,code',
            'type' => ['required', Rule::enum(DdtType::class)],
            'supplier_id' => 'nullable|exists:suppliers,id',
            'customer_id' => 'nullable|exists:customers,id',
            'site_id' => 'nullable|exists:sites,id',
            'from_warehouse_id' => 'required|exists:warehouses,id',
            'to_warehouse_id' => 'nullable|exists:warehouses,id',
            'ddt_number' => 'required|string|max:100',
            'ddt_date' => 'required|date',
            'transport_date' => 'nullable|date',
            'carrier_name' => 'nullable|string|max:255',
            'tracking_number' => 'nullable|string|max:100',
            'rental_start_date' => 'nullable|date',
            'rental_end_date' => 'nullable|date|after:rental_start_date',
            'parent_ddt_id' => 'nullable|exists:ddts,id',
            'return_reason' => ['nullable', Rule::enum(ReturnReason::class)],
            'return_notes' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.material_id' => 'required|exists:materials,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit' => 'required|string|max:20',
            'items.*.unit_cost' => 'nullable|numeric|min:0',
            'items.*.notes' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Il tipo di DDT è obbligatorio.',
            'from_warehouse_id.required' => 'Il magazzino di origine è obbligatorio.',
            'ddt_number.required' => 'Il numero DDT è obbligatorio.',
            'ddt_date.required' => 'La data DDT è obbligatoria.',
            'items.required' => 'Devi inserire almeno un articolo.',
            'items.min' => 'Devi inserire almeno un articolo.',
            'items.*.material_id.required' => 'Ogni articolo deve avere un materiale.',
            'items.*.quantity.required' => 'La quantità è obbligatoria per ogni articolo.',
            'items.*.quantity.min' => 'La quantità deve essere maggiore di zero.',
        ];
    }
}
