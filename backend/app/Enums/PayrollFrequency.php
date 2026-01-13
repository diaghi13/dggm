<?php

namespace App\Enums;

enum PayrollFrequency: string
{
    case Monthly = 'monthly';
    case Biweekly = 'biweekly';
    case Weekly = 'weekly';

    public function label(): string
    {
        return match ($this) {
            self::Monthly => 'Mensile',
            self::Biweekly => 'Quindicinale',
            self::Weekly => 'Settimanale',
        };
    }

    public function periodsPerYear(): int
    {
        return match ($this) {
            self::Monthly => 12,
            self::Biweekly => 26,
            self::Weekly => 52,
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Monthly => 'blue',
            self::Biweekly => 'purple',
            self::Weekly => 'green',
        };
    }
}
