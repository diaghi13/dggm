<?php

namespace App\Data;

use Spatie\LaravelData\Data;

class AssignWorkerToServiceData extends Data
{
    public function __construct(
        public int $project_worker_id,
        public ?float $assigned_hours = null,
        public ?string $notes = null,
    ) {}

    public static function rules(): array
    {
        return [
            'project_worker_id' => ['required', 'integer', 'exists:project_workers,id'],
            'assigned_hours' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
