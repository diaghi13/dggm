<?php

namespace App\Domains\Project\Data;

use App\Domains\Customer\Data\CustomerData;
use Spatie\LaravelData\Attributes\WithoutValidation;
use Spatie\LaravelData\Data;

class ProjectData extends Data
{
    public function __construct(
        public ?int $id,
        public ?string $code,
        public string $name,
        public ?string $description,
        public int $customer_id,
        public ?int $quote_id,
        public ?string $address,
        public ?string $city,
        public ?string $province,
        public ?string $postal_code,
        public ?string $country,
        public ?float $latitude,
        public ?float $longitude,
        public ?int $gps_radius,
        public ?int $project_manager_id,
        public ?float $estimated_amount,
        public ?float $actual_cost,
        public ?float $invoiced_amount,
        public ?string $start_date,
        public ?string $estimated_end_date,
        public ?string $actual_end_date,
        public string $status,
        public ?string $priority,
        public ?string $notes,
        public ?string $internal_notes,
        public bool $is_active = true,
        #[WithoutValidation]
        public ?CustomerData $customer = null,
    ) {}

    public static function fromModel(\App\Domains\Project\Models\Project $project): self
    {
        return new self(
            id: $project->id,
            code: $project->code,
            name: $project->name,
            description: $project->description,
            customer_id: $project->customer_id,
            quote_id: $project->quote_id,
            address: $project->address,
            city: $project->city,
            province: $project->province,
            postal_code: $project->postal_code,
            country: $project->country,
            latitude: $project->latitude,
            longitude: $project->longitude,
            gps_radius: $project->gps_radius,
            project_manager_id: $project->project_manager_id,
            estimated_amount: $project->estimated_amount,
            actual_cost: $project->actual_cost,
            invoiced_amount: $project->invoiced_amount,
            start_date: $project->start_date?->format('Y-m-d'),
            estimated_end_date: $project->estimated_end_date?->format('Y-m-d'),
            actual_end_date: $project->actual_end_date?->format('Y-m-d'),
            status: $project->status instanceof \BackedEnum ? $project->status->value : (string) $project->status,
            priority: $project->priority instanceof \BackedEnum ? $project->priority->value : $project->priority,
            notes: $project->notes,
            internal_notes: $project->internal_notes,
            is_active: $project->is_active,
            customer: $project->relationLoaded('customer') && $project->customer
                ? CustomerData::from($project->customer)
                : null,
        );
    }

    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'status' => ['required', 'string', 'in:draft,planned,in_progress,on_hold,completed,cancelled'],
            'code' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'quote_id' => ['nullable', 'integer', 'exists:quotes,id'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:100'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'gps_radius' => ['nullable', 'integer', 'min:0'],
            'project_manager_id' => ['nullable', 'integer', 'exists:users,id'],
            'estimated_amount' => ['nullable', 'numeric', 'min:0'],
            'actual_cost' => ['nullable', 'numeric', 'min:0'],
            'invoiced_amount' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'estimated_end_date' => ['nullable', 'date'],
            'actual_end_date' => ['nullable', 'date'],
            'priority' => ['nullable', 'string', 'in:low,medium,high,critical'],
            'notes' => ['nullable', 'string'],
            'internal_notes' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];
    }
}
