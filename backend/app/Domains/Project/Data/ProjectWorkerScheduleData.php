<?php

namespace App\Domains\Project\Data;

use App\Enums\ProjectScheduleDayStatus;
use Spatie\LaravelData\Data;

class ProjectWorkerScheduleData extends Data
{
    public function __construct(
        public ?int $id,
        public int $project_id,
        public int $worker_id,
        public string $scheduled_date,
        public ?string $planned_start_time = null,
        public ?string $planned_end_time = null,
        public ?float $planned_hours = null,
        public ProjectScheduleDayStatus $status = ProjectScheduleDayStatus::Pending,
        public ?string $accepted_at = null,
        public ?string $rejected_at = null,
        public ?string $rejection_reason = null,
        public ?string $notes = null,
        public ?float $cost_rate = null,
        public ?float $customer_rate = null,

        // Computed (output only)
        public readonly ?float $effective_planned_hours = null,
    ) {}

    public static function rules(): array
    {
        return [
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'worker_id' => ['required', 'integer', 'exists:workers,id'],
            'scheduled_date' => ['required', 'date'],
            'planned_start_time' => ['nullable', 'date_format:H:i'],
            'planned_end_time' => ['nullable', 'date_format:H:i', 'after:planned_start_time'],
            'planned_hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'status' => ['nullable', 'string'],
            'rejection_reason' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'cost_rate' => ['nullable', 'numeric', 'min:0'],
            'customer_rate' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public static function fromModel(\App\Domains\Project\Models\ProjectWorkerSchedule $schedule): self
    {
        return new self(
            id: $schedule->id,
            project_id: $schedule->project_id,
            worker_id: $schedule->worker_id,
            scheduled_date: $schedule->scheduled_date->format('Y-m-d'),
            planned_start_time: $schedule->planned_start_time,
            planned_end_time: $schedule->planned_end_time,
            planned_hours: $schedule->planned_hours,
            status: $schedule->status,
            accepted_at: $schedule->accepted_at?->toIso8601String(),
            rejected_at: $schedule->rejected_at?->toIso8601String(),
            rejection_reason: $schedule->rejection_reason,
            notes: $schedule->notes,
            cost_rate: $schedule->cost_rate !== null ? (float) $schedule->cost_rate : null,
            customer_rate: $schedule->customer_rate !== null ? (float) $schedule->customer_rate : null,
            effective_planned_hours: $schedule->effective_planned_hours,
        );
    }
}
