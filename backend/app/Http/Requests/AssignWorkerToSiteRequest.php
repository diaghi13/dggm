<?php

namespace App\Http\Requests;

use App\Models\SiteWorker;
use Illuminate\Foundation\Http\FormRequest;

class AssignWorkerToSiteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', SiteWorker::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'worker_id' => 'required|exists:workers,id',
            'assigned_from' => 'required|date',
            'assigned_to' => 'nullable|date|after_or_equal:assigned_from',
            'role_ids' => 'nullable|array',
            'role_ids.*' => 'exists:site_roles,id',
            'hourly_rate_override' => 'nullable|numeric|min:0',
            'fixed_rate_override' => 'nullable|numeric|min:0',
            'rate_override_notes' => 'nullable|string|max:1000',
            'estimated_hours' => 'nullable|numeric|min:0',
            'response_days' => 'nullable|integer|min:1|max:30',
            'notes' => 'nullable|string',
        ];
    }
}
