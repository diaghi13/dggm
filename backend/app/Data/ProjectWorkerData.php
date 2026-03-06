<?php

namespace App\Data;

use Spatie\LaravelData\Data;

class ProjectWorkerData extends Data
{
    public function __construct(
        public ?int $id,
        public ?int $project_id,
        public ?int $worker_id,
        public ?string $status,
        public ?int $assigned_by_user_id,
        public ?string $site_role,
        public ?string $assigned_from,
        public ?string $assigned_to,
        public ?string $responded_at,
        public ?string $response_due_at,
        public ?string $rejection_reason,
        public ?float $hourly_rate_override,
        public ?float $fixed_rate_override,
        public ?string $rate_override_notes,
        public ?float $estimated_hours,
        public bool $is_active = true,
        public ?string $notes = null,
    ) {}

    public static function rules(): array
    {
        return [
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'worker_id' => ['nullable', 'integer', 'exists:workers,id'],
            'status' => ['nullable', 'string', 'in:pending,accepted,rejected,active,completed,cancelled'],
            'assigned_by_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'site_role' => ['nullable', 'string', 'max:255'],
            'assigned_from' => ['nullable', 'date'],
            'assigned_to' => ['nullable', 'date'],
            'responded_at' => ['nullable', 'date'],
            'response_due_at' => ['nullable', 'date'],
            'rejection_reason' => ['nullable', 'string'],
            'hourly_rate_override' => ['nullable', 'numeric', 'min:0'],
            'fixed_rate_override' => ['nullable', 'numeric', 'min:0'],
            'rate_override_notes' => ['nullable', 'string', 'max:255'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
