<?php

namespace App\Data;

use Spatie\LaravelData\Data;

class ResolveIncidentData extends Data
{
    public function __construct(
        public string $resolution_notes,
        public ?float $charge_amount = null,
        public ?bool $is_chargeable_to_client = null,
    ) {}

    public static function rules(): array
    {
        return [
            'resolution_notes' => ['required', 'string', 'max:2000'],
            'charge_amount' => ['nullable', 'numeric', 'min:0'],
            'is_chargeable_to_client' => ['nullable', 'boolean'],
        ];
    }
}
