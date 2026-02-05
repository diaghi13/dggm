<?php

namespace App\Enums;

enum SettingType: string
{
    case STRING = 'string';
    case NUMBER = 'number';
    case BOOLEAN = 'boolean';
    case JSON = 'json';
    case EMAIL = 'email';
    case URL = 'url';
    case COLOR = 'color'; // Hex color (#RRGGBB)
    case DATE = 'date'; // YYYY-MM-DD
    case DATETIME = 'datetime'; // ISO 8601
    case FILE = 'file'; // File path/URL
    case ENUM = 'enum'; // Predefined list of values

    /**
     * Get validation rules for this type
     */
    public function validationRules(): array
    {
        return match ($this) {
            self::STRING => ['string'],
            self::NUMBER => ['numeric'],
            self::BOOLEAN => ['boolean'],
            self::JSON => ['json'],
            self::EMAIL => ['email:rfc,dns'],
            self::URL => ['url'],
            self::COLOR => ['string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            self::DATE => ['date_format:Y-m-d'],
            self::DATETIME => ['date'],
            self::FILE => ['string'], // Path or URL
            self::ENUM => ['string'], // Will be validated against allowed_values
        };
    }

    /**
     * Get human-readable label
     */
    public function label(): string
    {
        return match ($this) {
            self::STRING => 'Text',
            self::NUMBER => 'Number',
            self::BOOLEAN => 'True/False',
            self::JSON => 'JSON Object',
            self::EMAIL => 'Email Address',
            self::URL => 'URL',
            self::COLOR => 'Color (Hex)',
            self::DATE => 'Date',
            self::DATETIME => 'Date & Time',
            self::FILE => 'File',
            self::ENUM => 'Select Option',
        };
    }

    /**
     * Get all types as array for API
     */
    public static function toArray(): array
    {
        return array_map(
            fn (self $type) => [
                'value' => $type->value,
                'label' => $type->label(),
                'validation' => $type->validationRules(),
            ],
            self::cases()
        );
    }
}
