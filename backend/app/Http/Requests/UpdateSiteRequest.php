<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSiteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('sites.edit');
    }

    public function rules(): array
    {
        $siteId = $this->route('site')->id;

        return [
            'code' => ['sometimes', 'string', 'max:255', "unique:sites,code,{$siteId}"],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'customer_id' => ['sometimes', 'integer', 'exists:customers,id'],
            'quote_id' => ['nullable', 'integer', 'exists:quotes,id'],
            'address' => ['sometimes', 'string', 'max:255'],
            'city' => ['sometimes', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:10'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'gps_radius' => ['nullable', 'integer', 'min:10', 'max:1000'],
            'project_manager_id' => ['nullable', 'integer', 'exists:users,id'],
            'estimated_amount' => ['nullable', 'numeric', 'min:0'],
            'actual_cost' => ['nullable', 'numeric', 'min:0'],
            'invoiced_amount' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'estimated_end_date' => ['nullable', 'date'],
            'actual_end_date' => ['nullable', 'date'],
            'status' => ['sometimes', 'string', 'in:draft,planned,in_progress,on_hold,completed,cancelled'],
            'priority' => ['nullable', 'string', 'in:low,medium,high,urgent'],
            'notes' => ['nullable', 'string'],
            'internal_notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
