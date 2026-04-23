<?php

namespace App\Data;

use App\Enums\DamageSeverity;
use App\Enums\IncidentType;
use Spatie\LaravelData\Data;

class ReportIncidentData extends Data
{
    public function __construct(
        public int $project_material_id,
        public IncidentType $incident_type,
        public string $description,
        public string $incident_date,
        public ?DamageSeverity $damage_severity = null,
        public ?float $charge_amount = null,
        public ?int $ddt_item_id = null,
        public ?float $quantity = null,
    ) {}

    public static function rules(): array
    {
        return [
            'project_material_id' => ['required', 'integer', 'exists:project_materials,id'],
            'incident_type' => ['required', 'string'],
            'damage_severity' => ['nullable', 'string'],
            'description' => ['required', 'string', 'max:2000'],
            'incident_date' => ['required', 'date'],
            'charge_amount' => ['nullable', 'numeric', 'min:0'],
            'ddt_item_id' => ['nullable', 'integer', 'exists:ddt_items,id'],
            'quantity' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
