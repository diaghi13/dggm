<?php

namespace App\Data;

use Spatie\LaravelData\Data;

class ProjectLaborCostData extends Data
{
    public function __construct(
        public ?int $id,
        public ?int $project_id,
        public ?string $cost_type,
        public ?int $worker_id,
        public ?int $contractor_id,
        public ?string $description,
        public ?string $work_date,
        public ?float $hours_worked,
        public ?float $quantity,
        public ?float $unit_rate,
        public ?float $total_cost,
        public ?string $currency,
        public bool $is_overtime = false,
        public bool $is_holiday = false,
        public ?string $cost_category = null,
        public ?string $invoice_number = null,
        public ?string $invoice_date = null,
        public bool $is_invoiced = false,
        public ?string $notes = null,
    ) {}

    public static function rules(): array
    {
        return [
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'cost_type' => ['nullable', 'string', 'max:50'],
            'worker_id' => ['nullable', 'integer', 'exists:workers,id'],
            'contractor_id' => ['nullable', 'integer', 'exists:contractors,id'],
            'description' => ['nullable', 'string'],
            'work_date' => ['nullable', 'date'],
            'hours_worked' => ['nullable', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'numeric', 'min:0'],
            'unit_rate' => ['nullable', 'numeric', 'min:0'],
            'total_cost' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:10'],
            'is_overtime' => ['boolean'],
            'is_holiday' => ['boolean'],
            'cost_category' => ['nullable', 'string', 'max:100'],
            'invoice_number' => ['nullable', 'string', 'max:100'],
            'invoice_date' => ['nullable', 'date'],
            'is_invoiced' => ['boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
