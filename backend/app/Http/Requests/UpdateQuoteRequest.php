<?php

namespace App\Http\Requests;

use App\Enums\QuoteItemType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|required|string|max:255',
            'customer_id' => 'sometimes|required|exists:customers,id',
            'project_manager_id' => 'nullable|exists:users,id',
            'description' => 'nullable|string',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:2',
            'postal_code' => 'nullable|string|max:10',
            'status' => 'sometimes|in:draft,sent,approved,rejected,expired,converted',
            'issue_date' => 'sometimes|required|date',
            'expiry_date' => 'nullable|date|after:issue_date',
            'valid_until' => 'nullable|date',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'tax_percentage' => 'nullable|numeric|min:0|max:100',
            'show_tax' => 'nullable|boolean',
            'tax_included' => 'nullable|boolean',
            'show_unit_prices' => 'nullable|boolean',
            'payment_method' => 'nullable|string|max:255',
            'payment_terms' => 'nullable|string',
            'template_id' => 'nullable|exists:quote_templates,id',
            'notes' => 'nullable|string',
            'terms_and_conditions' => 'nullable|string',
            'footer_text' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'items' => 'nullable|array',
            'items.*.id' => 'nullable|integer',
            'items.*.parent_id' => 'nullable|integer',
            'items.*.material_id' => 'nullable|exists:materials,id',
            'items.*.type' => ['required', Rule::enum(QuoteItemType::class)],
            'items.*.code' => 'nullable|string|max:50',
            'items.*.description' => 'required|string',
            'items.*.notes' => 'nullable|string',
            'items.*.unit' => 'nullable|string|max:20',
            'items.*.quantity' => 'nullable|numeric|min:0',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'items.*.hide_unit_price' => 'nullable|boolean',
            'items.*.sort_order' => 'required|integer|min:0',
        ];
    }
}
