<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectWorkerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $projectWorker = $this->route('project_worker');

        return $this->user()->can('update', $projectWorker);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'assigned_from' => 'sometimes|date',
            'assigned_to' => 'nullable|date|after_or_equal:assigned_from',
            'role_ids' => 'nullable|array',
            'role_ids.*' => 'exists:project_roles,id',
            'hourly_rate_override' => 'nullable|numeric|min:0',
            'fixed_rate_override' => 'nullable|numeric|min:0',
            'rate_override_notes' => 'nullable|string|max:1000',
            'estimated_hours' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ];
    }
}
