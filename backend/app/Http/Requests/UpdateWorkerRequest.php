<?php

namespace App\Http\Requests;

use App\Enums\ContractType;
use App\Enums\WorkerType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWorkerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('workers.edit');
    }

    public function rules(): array
    {
        $workerId = $this->route('worker')->id;

        return [
            'worker_type' => ['sometimes', Rule::enum(WorkerType::class)],
            'contract_type' => ['sometimes', Rule::enum(ContractType::class)],
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'tax_code' => ['nullable', 'string', 'max:16', Rule::unique('workers')->ignore($workerId)],
            'vat_number' => ['nullable', 'string', 'max:11', Rule::unique('workers')->ignore($workerId)],
            'birth_date' => ['nullable', 'date'],
            'birth_place' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'mobile' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:2'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'country' => ['nullable', 'string', 'max:2'],
            'contractor_company_id' => ['nullable', 'exists:contractors,id'],
            'user_id' => ['nullable', 'exists:users,id'],
            'hire_date' => ['sometimes', 'date'],
            'termination_date' => ['nullable', 'date'],
            'contract_end_date' => ['nullable', 'date'],
            'job_title' => ['nullable', 'string', 'max:100'],
            'job_level' => ['nullable', 'string', 'max:50'],
            'specializations' => ['nullable', 'array'],
            'certifications' => ['nullable', 'array'],
            'is_active' => ['boolean'],
            'can_drive_company_vehicles' => ['boolean'],
            'has_safety_training' => ['boolean'],
            'safety_training_expires_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'internal_notes' => ['nullable', 'string'],
            'payroll_data' => ['nullable', 'array'],
            'payroll_data.gross_monthly_salary' => ['sometimes', 'numeric', 'min:0'],
            'payroll_data.net_monthly_salary' => ['nullable', 'numeric', 'min:0'],
            'payroll_data.contract_level' => ['nullable', 'string', 'max:50'],
            'payroll_data.ccnl_type' => ['nullable', 'string', 'max:100'],
            'payroll_data.payroll_frequency' => ['nullable', 'string'],
            'payroll_data.inps_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payroll_data.inail_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payroll_data.irpef_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payroll_data.meal_voucher_amount' => ['nullable', 'numeric', 'min:0'],
            'payroll_data.transport_allowance' => ['nullable', 'numeric', 'min:0'],
            'payroll_data.iban' => ['nullable', 'string', 'max:34'],
            'payroll_data.bank_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
