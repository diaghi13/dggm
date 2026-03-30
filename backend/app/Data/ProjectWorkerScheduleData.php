<?php

namespace App\Data;

use App\Enums\ProjectScheduleDayStatus;
use Spatie\LaravelData\Data;

class ProjectWorkerScheduleData extends Data
{
    public function __construct(
        public ?int $id,
        public int $project_worker_id,
        public string $scheduled_date,
        public ?string $planned_start_time = null,
        public ?string $planned_end_time = null,
        public ?float $planned_hours = null,
        public ProjectScheduleDayStatus $status = ProjectScheduleDayStatus::Pending,
        public ?string $accepted_at = null,
        public ?string $rejected_at = null,
        public ?string $rejection_reason = null,
        public ?string $notes = null,

        // Computed (output only)
        public readonly ?float $effective_planned_hours = null,
    ) {}

    public static function rules(): array
    {
        return [
            'project_worker_id' => ['required', 'integer', 'exists:project_workers,id'],
            'scheduled_date' => ['required', 'date'],
            'planned_start_time' => ['nullable', 'date_format:H:i'],
            'planned_end_time' => ['nullable', 'date_format:H:i', 'after:planned_start_time'],
            'planned_hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'status' => ['nullable', 'string'],
            'rejection_reason' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public static function fromModel(\App\Models\ProjectWorkerSchedule $schedule): self
    {
        return new self(
            id: $schedule->id,
            project_worker_id: $schedule->project_worker_id,
            scheduled_date: $schedule->scheduled_date->format('Y-m-d'),
            planned_start_time: $schedule->planned_start_time,
            planned_end_time: $schedule->planned_end_time,
            planned_hours: $schedule->planned_hours,
            status: $schedule->status,
            accepted_at: $schedule->accepted_at?->toIso8601String(),
            rejected_at: $schedule->rejected_at?->toIso8601String(),
            rejection_reason: $schedule->rejection_reason,
            notes: $schedule->notes,
            effective_planned_hours: $schedule->effective_planned_hours,
        );
    }
}
