<?php

namespace App\Enums;

/**
 * Payment Method Enum
 *
 * Represents the actual payment methods used in transactions
 * (how the payment is made, not where the money goes)
 */
enum PaymentMethod: string
{
    case BANK_TRANSFER = 'bank_transfer';      // Bonifico bancario
    case CREDIT_CARD = 'credit_card';          // Carta di credito
    case DEBIT_CARD = 'debit_card';            // Carta di debito/Bancomat
    case CASH = 'cash';                        // Contanti
    case CHECK = 'check';                      // Assegno
    case RIBA = 'riba';                        // Ri.Ba. (Ricevuta Bancaria)
    case RID = 'rid';                          // RID (Rapporti Interbancari Diretti)
    case PAYPAL = 'paypal';                    // PayPal
    case SEPA_DIRECT_DEBIT = 'sepa_dd';       // Addebito diretto SEPA
    case WIRE_TRANSFER = 'wire_transfer';      // Bonifico internazionale

    /**
     * Get human-readable label
     */
    public function label(): string
    {
        return match ($this) {
            self::BANK_TRANSFER => 'Bonifico Bancario',
            self::CREDIT_CARD => 'Carta di Credito',
            self::DEBIT_CARD => 'Carta di Debito',
            self::CASH => 'Contanti',
            self::CHECK => 'Assegno',
            self::RIBA => 'Ri.Ba.',
            self::RID => 'RID',
            self::PAYPAL => 'PayPal',
            self::SEPA_DIRECT_DEBIT => 'Addebito SEPA',
            self::WIRE_TRANSFER => 'Bonifico Internazionale',
        };
    }

    /**
     * Get icon for display
     */
    public function icon(): string
    {
        return match ($this) {
            self::BANK_TRANSFER => '🏦',
            self::CREDIT_CARD => '💳',
            self::DEBIT_CARD => '💳',
            self::CASH => '💰',
            self::CHECK => '📝',
            self::RIBA => '📄',
            self::RID => '🔄',
            self::PAYPAL => '🅿️',
            self::SEPA_DIRECT_DEBIT => '🔄',
            self::WIRE_TRANSFER => '🌍',
        };
    }

    /**
     * Check if this payment method requires bank details
     */
    public function requiresBankDetails(): bool
    {
        return match ($this) {
            self::BANK_TRANSFER,
            self::WIRE_TRANSFER,
            self::RIBA,
            self::RID,
            self::SEPA_DIRECT_DEBIT => true,
            default => false,
        };
    }

    /**
     * Check if this is an electronic payment method
     */
    public function isElectronic(): bool
    {
        return match ($this) {
            self::BANK_TRANSFER,
            self::CREDIT_CARD,
            self::DEBIT_CARD,
            self::PAYPAL,
            self::WIRE_TRANSFER,
            self::RIBA,
            self::RID,
            self::SEPA_DIRECT_DEBIT => true,
            default => false,
        };
    }
}
