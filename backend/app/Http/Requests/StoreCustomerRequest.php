<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('customers.create');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in(['individual', 'company'])],

            // Individual fields (required if type is individual)
            'first_name' => ['required_if:type,individual', 'nullable', 'string', 'max:255'],
            'last_name' => ['required_if:type,individual', 'nullable', 'string', 'max:255'],

            // Company fields (required if type is company)
            'company_name' => ['required_if:type,company', 'nullable', 'string', 'max:255'],
            'vat_number' => ['required_if:type,company', 'nullable', 'string', 'max:255', 'unique:customers,vat_number'],
            'tax_code' => ['required_if:type,individual', 'nullable', 'string', 'max:255'],

            // Common fields
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'mobile' => ['nullable', 'string', 'max:255'],

            // Address
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'size:2'],
            'postal_code' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:2'],

            // Billing
            'payment_terms' => ['nullable', 'string', 'max:255'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],

            // Additional
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'type.required' => 'Customer type is required',
            'type.in' => 'Customer type must be individual or company',
            'first_name.required_if' => 'First name is required for individual customers',
            'last_name.required_if' => 'Last name is required for individual customers',
            'company_name.required_if' => 'Company name is required for company customers',
            'vat_number.required_if' => 'VAT number is required for company customers',
            'vat_number.unique' => 'This VAT number is already registered',
            'tax_code.required_if' => 'Tax code is required for individual customers',
            'email.email' => 'Please provide a valid email address',
            'province.size' => 'Province must be a 2-letter code',
            'country.max' => 'Country must be a 2-letter code',
        ];
    }
}
