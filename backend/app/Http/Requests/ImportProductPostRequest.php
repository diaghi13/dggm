<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportProductPostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $leadTimeDays = $this->input('products.*.lead_time_days', 5);

        $this->merge([
            'products.*.lead_time_days' => is_numeric($leadTimeDays) ? (int)$leadTimeDays : 5,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'products' => 'required|array|min:1',
            'products.*.code' => 'required|string|max:255',
            'products.*.name' => 'required|string|max:255',
            'products.*.type' => 'nullable|string|in:article,service,composite',
            'products.*.unit' => 'nullable|string|max:50',
            'products.*.description' => 'nullable|string',

            // Codes & Identifiers
            'products.*.internal_code' => 'nullable|string|max:50',
            'products.*.ean' => 'nullable|string|max:13',
            'products.*.etim_code' => 'nullable|string|max:20',
            'products.*.barcode' => 'nullable|string|max:255',
            'products.*.qr_code' => 'nullable|string|max:255',

            // Relations (virtual fields - will be transformed to IDs)
            'products.*.category' => 'nullable', // Can be ID (int) or string (code/name)
            'products.*.brand' => 'nullable', // Can be ID (int) or string (code/name)
            'products.*.supplier_code' => 'nullable|string|max:255',

            // Pricing (manufacturer reference prices)
            'products.*.standard_cost' => 'nullable|numeric|min:0',
            'products.*.manufacturer_cost_price' => 'nullable|numeric|min:0',
            'products.*.manufacturer_retail_price' => 'nullable|numeric|min:0',
            'products.*.sale_markup_percent' => 'nullable|numeric|min:0|max:1000',

            // Package
            'products.*.is_package' => 'nullable|boolean',
            'products.*.package_weight' => 'nullable|numeric|min:0',
            'products.*.package_volume' => 'nullable|numeric|min:0',
            'products.*.package_dimensions' => 'nullable|string|max:100',

            // Rental
            'products.*.is_rentable' => 'nullable|boolean',

            // Inventory
            'products.*.reorder_level' => 'nullable|numeric|min:0',
            'products.*.reorder_quantity' => 'nullable|numeric|min:0',
            'products.*.lead_time_days' => 'nullable|numeric|min:0',
            'products.*.location' => 'nullable|string|max:255',

            // Other
            'products.*.notes' => 'nullable|string',
            'products.*.is_active' => 'nullable|boolean',
        ];
    }
}
