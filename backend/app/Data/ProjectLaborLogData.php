<?php

namespace App\Data;

use App\Enums\ProjectLogStatus;
use Spatie\LaravelData\Data;

class ProjectLaborLogData extends Data
{
    public function __construct(
        public ?int $id,
        public int $project_id,
        public int $project_worker_id,
        public ?int $worker_id = null,
        public ?int $schedule_day_id = null,
        public string $log_date = '',
        public float $regular_hours = 0,
        public float $overtime_hours = 0,
        public ?string $description = null,
        public ?int $submitted_by_user_id = null,
        public ProjectLogStatus $status = ProjectLogStatus::Draft,
        public ?int $approved_by_user_id = null,
        public ?string $approved_at = null,
        public ?string $rejection_reason = null,
        public ?int $labor_cost_id = null,

        // Computed (output only)
        public readonly ?float $total_hours = null,
        public readonly ?string $submitted_by_name = null,
    ) {}

    public static function rules(): array
    {
        return [
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'project_worker_id' => ['required', 'integer', 'exists:project_workers,id'],
            'worker_id' => ['nullable', 'integer', 'exists:workers,id'],
            'schedule_day_id' => ['nullable', 'integer', 'exists:project_worker_schedules,id'],
            'log_date' => ['required', 'date'],
            'regular_hours' => ['required', 'numeric', 'min:0', 'max:24'],
            'overtime_hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'description' => ['nullable', 'string'],
            'rejection_reason' => ['nullable', 'string'],
        ];
    }

    public static function fromModel(\App\Models\ProjectLaborLog $log): self
    {
        return new self(
            id: $log->id,
            project_id: $log->project_id,
            project_worker_id: $log->project_worker_id,
            worker_id: $log->worker_id,
            schedule_day_id: $log->schedule_day_id,
            log_date: $log->log_date->format('Y-m-d'),
            regular_hours: (float) $log->regular_hours,
            overtime_hours: (float) $log->overtime_hours,
            description: $log->description,
            submitted_by_user_id: $log->submitted_by_user_id,
            status: $log->status,
            approved_by_user_id: $log->approved_by_user_id,
            approved_at: $log->approved_at?->toIso8601String(),
            rejection_reason: $log->rejection_reason,
            labor_cost_id: $log->labor_cost_id,
            total_hours: $log->total_hours,
            submitted_by_name: $log->relationLoaded('submittedBy') ? $log->submittedBy?->name : null,
        );
    }
}
