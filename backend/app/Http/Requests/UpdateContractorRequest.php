<?php

namespace App\Http\Requests;

use App\Enums\ContractorType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContractorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('contractors.edit');
    }

    public function rules(): array
    {
        $contractorId = $this->route('contractor')->id;

        return [
            'company_name' => ['sometimes', 'string', 'max:255'],
            'vat_number' => ['sometimes', 'string', 'max:11', Rule::unique('contractors')->ignore($contractorId)],
            'tax_code' => ['nullable', 'string', 'max:16'],
            'contractor_type' => ['sometimes', Rule::enum(ContractorType::class)],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'website' => ['nullable', 'url', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:2'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'country' => ['nullable', 'string', 'max:2'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:20'],
            'iban' => ['nullable', 'string', 'max:34'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'payment_terms' => ['nullable', 'string', 'max:100'],
            'specializations' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];
    }
}
