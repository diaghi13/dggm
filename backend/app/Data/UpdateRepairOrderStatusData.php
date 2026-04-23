<?php

namespace App\Data;

use App\Enums\RepairOrderStatus;
use Spatie\LaravelData\Data;

class UpdateRepairOrderStatusData extends Data
{
    public function __construct(
        public RepairOrderStatus $status,
        public ?string $actual_return_date = null,
        public ?float $repair_cost = null,
        public ?string $repair_notes = null,
    ) {}

    public static function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:pending,sent_external,in_repair,completed,unrepairable'],
            'actual_return_date' => ['nullable', 'date'],
            'repair_cost' => ['nullable', 'numeric', 'min:0'],
            'repair_notes' => ['nullable', 'string'],
        ];
    }
}
