<?php

namespace App\Enums;

enum RateContext: string
{
    case InternalCost = 'internal_cost';
    case CustomerBilling = 'customer_billing';
    case Payroll = 'payroll';

    public function label(): string
    {
        return match ($this) {
            self::InternalCost => 'Costo Interno',
            self::CustomerBilling => 'Fatturazione Cliente',
            self::Payroll => 'Busta Paga',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::InternalCost => 'Tariffa per allocazione costi su cantiere',
            self::CustomerBilling => 'Tariffa di fatturazione al cliente',
            self::Payroll => 'Costo per busta paga (solo dipendenti)',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::InternalCost => 'blue',
            self::CustomerBilling => 'green',
            self::Payroll => 'purple',
        };
    }
}
