<?php

namespace App\Domains\Project\Data;

use App\Enums\OvertimeCause;
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
        public ?string $clock_in = null,
        public ?string $clock_out = null,
        public int $break_minutes = 0,
        public float $regular_hours = 0,
        public float $overtime_hours = 0,
        public ?string $description = null,
        public ?int $submitted_by_user_id = null,
        public ProjectLogStatus $status = ProjectLogStatus::Draft,
        public ?int $approved_by_user_id = null,
        public ?string $approved_at = null,
        public ?string $rejection_reason = null,
        public ?int $labor_cost_id = null,
        public ?OvertimeCause $overtime_cause = null,
        public ?bool $is_billable_to_client = null,
        public ?float $overtime_rate_multiplier = null,
        public ?bool $include_in_final_balance = null,
        public ?string $overtime_rate_type = null,
        public ?float $overtime_direct_rate = null,
        public bool $is_auto_approved = false,

        // Computed (output only)
        public readonly ?float $total_hours = null,
        public readonly ?string $submitted_by_name = null,
        public readonly ?string $worker_name = null,
    ) {}

    public static function rules(): array
    {
        return [
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'project_worker_id' => ['required', 'integer', 'exists:project_workers,id'],
            'worker_id' => ['nullable', 'integer', 'exists:workers,id'],
            'schedule_day_id' => ['nullable', 'integer', 'exists:project_worker_schedules,id'],
            'log_date' => ['required', 'date'],
            'clock_in' => ['nullable', 'date_format:H:i'],
            'clock_out' => ['nullable', 'date_format:H:i'],
            'regular_hours' => ['required', 'numeric', 'min:0', 'max:24'],
            'overtime_hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'description' => ['nullable', 'string'],
            'rejection_reason' => ['nullable', 'string'],
            'overtime_cause' => ['nullable', 'string'],
            'is_billable_to_client' => ['nullable', 'boolean'],
            'overtime_rate_multiplier' => ['nullable', 'numeric', 'min:0'],
            'include_in_final_balance' => ['nullable', 'boolean'],
            'break_minutes' => ['integer', 'min:0', 'max:480'],
            'overtime_rate_type' => ['nullable', 'in:multiplier,direct_rate'],
            'overtime_direct_rate' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public static function fromModel(\App\Domains\Project\Models\ProjectLaborLog $log): self
    {
        return new self(
            id: $log->id,
            project_id: $log->project_id,
            project_worker_id: $log->project_worker_id,
            worker_id: $log->worker_id,
            schedule_day_id: $log->schedule_day_id,
            log_date: $log->log_date->format('Y-m-d'),
            clock_in: $log->clock_in,
            clock_out: $log->clock_out,
            break_minutes: (int) ($log->break_minutes ?? 0),
            regular_hours: (float) $log->regular_hours,
            overtime_hours: (float) $log->overtime_hours,
            description: $log->description,
            submitted_by_user_id: $log->submitted_by_user_id,
            status: $log->status,
            approved_by_user_id: $log->approved_by_user_id,
            approved_at: $log->approved_at?->toIso8601String(),
            rejection_reason: $log->rejection_reason,
            labor_cost_id: $log->labor_cost_id,
            overtime_cause: $log->overtime_cause,
            is_billable_to_client: $log->is_billable_to_client,
            overtime_rate_multiplier: $log->overtime_rate_multiplier !== null ? (float) $log->overtime_rate_multiplier : null,
            include_in_final_balance: $log->include_in_final_balance,
            overtime_rate_type: $log->overtime_rate_type,
            overtime_direct_rate: $log->overtime_direct_rate !== null ? (float) $log->overtime_direct_rate : null,
            is_auto_approved: (bool) ($log->is_auto_approved ?? false),
            total_hours: $log->total_hours,
            submitted_by_name: $log->relationLoaded('submittedBy') ? $log->submittedBy?->name : null,
            worker_name: $log->relationLoaded('worker') ? ($log->worker?->full_name ?? $log->worker?->user?->name) : null,
        );
    }
}
