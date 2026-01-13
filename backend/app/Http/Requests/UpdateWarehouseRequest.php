<?php

namespace App\Http\Requests;

use App\Enums\WarehouseType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWarehouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('warehouse'));
    }

    public function rules(): array
    {
        $warehouseId = $this->route('warehouse')->id;

        return [
            'code' => ['nullable', 'string', 'max:50', Rule::unique('warehouses', 'code')->ignore($warehouseId)],
            'name' => 'required|string|max:255',
            'type' => ['required', Rule::enum(WarehouseType::class)],
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:2',
            'postal_code' => 'nullable|string|max:10',
            'manager_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ];
    }
}
