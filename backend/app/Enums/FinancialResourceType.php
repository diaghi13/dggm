<?php

namespace App\Enums;

/**
 * Financial Resource Type
 *
 * Defines the type of financial resource available for the company
 * (where money is held/stored, not how it's paid)
 */
enum FinancialResourceType: string
{
    case BANK_ACCOUNT = 'bank_account';
    case CASH = 'cash';
    case CARD = 'card';

    /**
     * Get human-readable label
     */
    public function label(): string
    {
        return match ($this) {
            self::BANK_ACCOUNT => 'Conto Bancario',
            self::CASH => 'Cassa',
            self::CARD => 'Carta/POS',
        };
    }

    /**
     * Get icon for display
     */
    public function icon(): string
    {
        return match ($this) {
            self::BANK_ACCOUNT => '🏦',
            self::CASH => '💰',
            self::CARD => '💳',
        };
    }

    /**
     * Get required fields for this type
     */
    public function requiredFields(): array
    {
        return match ($this) {
            self::BANK_ACCOUNT => ['iban', 'bank_name', 'account_holder'],
            self::CASH => ['location'],
            self::CARD => ['card_type', 'provider'],
        };
    }

    /**
     * Get optional fields for this type
     */
    public function optionalFields(): array
    {
        return match ($this) {
            self::BANK_ACCOUNT => ['swift', 'branch'],
            self::CASH => [],
            self::CARD => ['last_digits'],
        };
    }
}
