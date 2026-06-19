<?php

namespace App\Domains\Project\Data;

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

        // Slot fields (added for labor system)
        public ?string $role_name = null,
        public int $slot_index = 1,
        public ?int $quote_item_id = null,
        public ?float $estimated_days = null,
        public ?float $budget_cost_rate = null,
        public ?float $actual_cost_rate = null,
        public ?float $customer_rate = null,
        public bool $is_external = false,
        public bool $is_scheduled = false,

        // Computed (output only)
        public readonly ?string $worker_name = null,
        public readonly ?string $worker_code = null,
        public readonly ?array $roles = null,
    ) {}

    public static function rules(): array
    {
        return [
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'worker_id' => ['nullable', 'integer', 'exists:workers,id'],
            'status' => ['nullable', 'string', 'in:slot,pending,accepted,rejected,active,completed,cancelled'],
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
            'role_name' => ['nullable', 'string', 'max:255'],
            'slot_index' => ['nullable', 'integer', 'min:1'],
            'quote_item_id' => ['nullable', 'integer', 'exists:quote_items,id'],
            'estimated_days' => ['nullable', 'numeric', 'min:0'],
            'budget_cost_rate' => ['nullable', 'numeric', 'min:0'],
            'actual_cost_rate' => ['nullable', 'numeric', 'min:0'],
            'customer_rate' => ['nullable', 'numeric', 'min:0'],
            'is_external' => ['boolean'],
            'is_scheduled' => ['boolean'],
        ];
    }

    public static function fromModel(\App\Domains\Project\Models\ProjectWorker $worker): self
    {
        return new self(
            id: $worker->id,
            project_id: $worker->project_id,
            worker_id: $worker->worker_id,
            status: $worker->status?->value,
            assigned_by_user_id: $worker->assigned_by_user_id,
            site_role: $worker->site_role,
            assigned_from: $worker->assigned_from?->format('Y-m-d'),
            assigned_to: $worker->assigned_to?->format('Y-m-d'),
            responded_at: $worker->responded_at?->toIso8601String(),
            response_due_at: $worker->response_due_at?->toIso8601String(),
            rejection_reason: $worker->rejection_reason,
            hourly_rate_override: $worker->hourly_rate_override,
            fixed_rate_override: $worker->fixed_rate_override,
            rate_override_notes: $worker->rate_override_notes,
            estimated_hours: $worker->estimated_hours,
            is_active: $worker->is_active ?? true,
            notes: $worker->notes,
            role_name: $worker->role_name,
            slot_index: $worker->slot_index ?? 1,
            quote_item_id: $worker->quote_item_id,
            estimated_days: $worker->estimated_days,
            budget_cost_rate: $worker->budget_cost_rate,
            actual_cost_rate: $worker->actual_cost_rate,
            customer_rate: $worker->customer_rate,
            is_external: $worker->is_external ?? false,
            is_scheduled: $worker->is_scheduled ?? false,
            worker_name: $worker->relationLoaded('worker') ? $worker->worker?->full_name : null,
            worker_code: $worker->relationLoaded('worker') ? $worker->worker?->code : null,
            roles: $worker->relationLoaded('roles') ? $worker->roles->map(fn ($r) => ['id' => $r->id, 'name' => $r->name, 'slug' => $r->slug, 'color' => $r->color])->toArray() : null,
        );
    }
}
