<?php

namespace App\Domains\Project\Data;

use App\Domains\Project\Models\ProjectService;
use App\Enums\ProjectServiceBillingUnit;
use App\Enums\ProjectServiceStatus;
use Spatie\LaravelData\Data;

class ProjectServiceData extends Data
{
    public function __construct(
        public readonly ?int $id,
        public readonly ?int $project_id,
        public string $description,
        public float $quantity,
        public float $unit_price,
        public ?float $cost_price,
        public string $billing_unit,
        public bool $is_from_quote,
        public ?int $quote_item_id,
        public string $status,
        public ?string $notes,
        public readonly ?int $created_by_user_id = null,
        public readonly ?string $created_by_name = null,
        public readonly ?float $total = null,
        public readonly ?float $margin = null,
        public readonly ?float $margin_percentage = null,
        /** @var array<int, array<string, mixed>>|null */
        public readonly ?array $workers = null,
    ) {}

    public static function rules(): array
    {
        return [
            'description' => ['required', 'string', 'max:1000'],
            'quantity' => ['required', 'numeric', 'min:0'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'billing_unit' => ['required', 'string', 'in:hour,day,flat'],
            'is_from_quote' => ['boolean'],
            'quote_item_id' => ['nullable', 'integer', 'exists:quote_items,id'],
            'status' => ['required', 'string', 'in:planned,in_progress,completed,cancelled'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public static function fromModel(ProjectService $model): self
    {
        return new self(
            id: $model->id,
            project_id: $model->project_id,
            description: $model->description,
            quantity: (float) $model->quantity,
            unit_price: (float) $model->unit_price,
            cost_price: $model->cost_price !== null ? (float) $model->cost_price : null,
            billing_unit: $model->billing_unit instanceof ProjectServiceBillingUnit
                ? $model->billing_unit->value
                : (string) $model->billing_unit,
            is_from_quote: $model->is_from_quote,
            quote_item_id: $model->quote_item_id,
            status: $model->status instanceof ProjectServiceStatus
                ? $model->status->value
                : (string) $model->status,
            notes: $model->notes,
            created_by_user_id: $model->created_by_user_id,
            created_by_name: $model->relationLoaded('createdBy') ? $model->createdBy?->name : null,
            total: $model->total,
            margin: $model->margin,
            margin_percentage: $model->margin_percentage,
            workers: $model->relationLoaded('workers')
                ? $model->workers->map(fn ($worker) => [
                    'project_worker_id' => $worker->id,
                    'assigned_hours' => $worker->pivot->assigned_hours !== null
                        ? (float) $worker->pivot->assigned_hours
                        : null,
                    'notes' => $worker->pivot->notes,
                    'worker' => $worker->relationLoaded('worker') ? [
                        'id' => $worker->worker?->id,
                        'name' => $worker->worker?->full_name ?? $worker->worker?->name,
                    ] : null,
                ])->toArray()
                : null,
        );
    }
}
