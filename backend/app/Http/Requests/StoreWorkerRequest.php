<?php

namespace App\Http\Requests;

use App\Enums\ContractType;
use App\Enums\WorkerType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWorkerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('workers.create');
    }

    public function rules(): array
    {
        return [
            'worker_type' => ['required', Rule::enum(WorkerType::class)],
            'contract_type' => ['required', Rule::enum(ContractType::class)],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'tax_code' => ['nullable', 'string', 'max:16', 'unique:workers,tax_code'],
            'vat_number' => ['nullable', 'string', 'max:11', 'unique:workers,vat_number', 'required_if:worker_type,freelancer'],
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
            'contractor_company_id' => ['nullable', 'exists:contractors,id', 'required_if:worker_type,contractor_company'],
            'user_id' => ['nullable', 'exists:users,id'],
            'hire_date' => ['required', 'date'],
            'contract_end_date' => ['nullable', 'date', 'after:hire_date'],
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
            'payroll_data' => ['nullable', 'array', 'required_if:worker_type,employee'],
            'payroll_data.gross_monthly_salary' => ['required_with:payroll_data', 'numeric', 'min:0'],
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
            'rates' => ['nullable', 'array'],
            'rates.*.rate_type' => ['required', 'string'],
            'rates.*.context' => ['required', 'string'],
            'rates.*.rate_amount' => ['required', 'numeric', 'min:0'],
            'rates.*.valid_from' => ['required', 'date'],
            'rates.*.overtime_multiplier' => ['nullable', 'numeric', 'min:1', 'max:3'],
            'rates.*.holiday_multiplier' => ['nullable', 'numeric', 'min:1', 'max:3'],
        ];
    }
}
