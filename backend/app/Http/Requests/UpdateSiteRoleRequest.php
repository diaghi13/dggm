<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSiteRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('site_roles.update');
    }

    public function rules(): array
    {
        $siteRoleId = $this->route('site_role');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                'alpha_dash',
                Rule::unique('site_roles', 'slug')->ignore($siteRoleId),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'color' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Il nome del ruolo è obbligatorio',
            'name.max' => 'Il nome non può superare i 255 caratteri',
            'slug.required' => 'Lo slug è obbligatorio',
            'slug.unique' => 'Questo slug è già in uso',
            'slug.alpha_dash' => 'Lo slug può contenere solo lettere, numeri, trattini e underscore',
            'description.max' => 'La descrizione non può superare i 1000 caratteri',
            'color.regex' => 'Il colore deve essere un codice esadecimale valido (es: #FF5733)',
            'sort_order.integer' => 'L\'ordine deve essere un numero intero',
            'sort_order.min' => 'L\'ordine deve essere maggiore o uguale a 0',
        ];
    }
}
