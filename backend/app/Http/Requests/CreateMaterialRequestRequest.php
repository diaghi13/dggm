<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateMaterialRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by policy
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'site_id' => ['required', 'integer', 'exists:sites,id'],
            'material_id' => ['required', 'integer', 'exists:materials,id'],
            'quantity_requested' => ['required', 'numeric', 'min:0.01'],
            'unit_of_measure' => ['nullable', 'string', 'max:50'],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'reason' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'needed_by' => ['nullable', 'date', 'after_or_equal:today'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'site_id.required' => 'Il cantiere è obbligatorio',
            'site_id.exists' => 'Il cantiere selezionato non esiste',
            'material_id.required' => 'Il materiale è obbligatorio',
            'material_id.exists' => 'Il materiale selezionato non esiste',
            'quantity_requested.required' => 'La quantità è obbligatoria',
            'quantity_requested.min' => 'La quantità deve essere maggiore di zero',
            'needed_by.after_or_equal' => 'La data richiesta non può essere nel passato',
        ];
    }
}
