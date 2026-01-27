<?php

namespace App\Http\Requests;

use App\Enums\ProductType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('product'));
    }

    public function rules(): array
    {
        $product = $this->route('product');

        return [
            'code' => ['nullable', 'string', 'max:50', Rule::unique('products')->ignore($product->id)],
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category' => 'sometimes|required|string|max:100',
            'product_type' => ['sometimes', 'required', Rule::enum(ProductType::class)],
            'is_package' => 'boolean',
            'package_weight' => 'nullable|numeric|min:0',
            'package_volume' => 'nullable|numeric|min:0',
            'package_dimensions' => 'nullable|string|max:255',
            'is_rentable' => 'boolean',
            'unit' => 'sometimes|required|string|max:20',
            'standard_cost' => 'nullable|numeric|min:0',
            'purchase_price' => 'nullable|numeric|min:0',
            'markup_percentage' => 'nullable|numeric|min:0|max:1000',
            'sale_price' => 'nullable|numeric|min:0',
            'rental_price_daily' => 'nullable|numeric|min:0',
            'rental_price_weekly' => 'nullable|numeric|min:0',
            'rental_price_monthly' => 'nullable|numeric|min:0',
            'barcode' => ['nullable', 'string', 'max:100', Rule::unique('products')->ignore($product->id)],
            'qr_code' => 'nullable|string|max:255',
            'default_supplier_id' => 'nullable|exists:suppliers,id',
            'reorder_level' => 'nullable|numeric|min:0',
            'reorder_quantity' => 'nullable|numeric|min:0',
            'lead_time_days' => 'nullable|integer|min:0',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'boolean',

            // Composite components (for COMPOSITE products)
            'components' => 'nullable|array',
            'components.*.component_product_id' => 'required|exists:products,id',
            'components.*.quantity' => 'required|numeric|min:0.01',
            'components.*.notes' => 'nullable|string|max:500',
        ];
    }
}
