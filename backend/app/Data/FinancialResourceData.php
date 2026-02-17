<?php

namespace App\Data;

use App\Enums\FinancialResourceType;
use Spatie\LaravelData\Attributes\Computed;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Financial Resource Data Transfer Object
 *
 * Represents a financial resource/destination for the company
 * (bank accounts, cash registers, cards/POS)
 */
class FinancialResourceData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[Required, Enum(FinancialResourceType::class)]
        public FinancialResourceType $type,

        #[Required, Max(255)]
        public string $name,

        #[Max(1000)]
        public ?string $description,

        #[ArrayType]
        public ?array $details,

        #[BooleanType]
        public bool $is_active,

        #[BooleanType]
        public bool $is_default,

        #[Min(0)]
        public int $sort_order,

        public ?string $notes,

        // Timestamps
        public string|Optional $created_at,
        public string|Optional $updated_at,
        public ?string $deleted_at,

        // Computed attributes
        #[Computed]
        public string|Optional $display_name = '',
        #[Computed]
        public string|Optional $formatted_bank_info = '',
        #[Computed]
        public string|Optional $formatted_cash_info = '',
        #[Computed]
        public string|Optional $formatted_card_info = '',
    ) {}

    public static function messages(): array
    {
        return [
            'type.required' => 'Il tipo di risorsa finanziaria è obbligatorio.',
            'type.enum' => 'Tipo di risorsa finanziaria non valido.',
            'name.required' => 'Il nome è obbligatorio.',
            'name.max' => 'Il nome non può superare 255 caratteri.',
            'description.max' => 'La descrizione non può superare 1000 caratteri.',
            'details.array' => 'I dettagli devono essere un array.',
            'sort_order.min' => 'L\'ordine deve essere maggiore o uguale a 0.',
        ];
    }
}
