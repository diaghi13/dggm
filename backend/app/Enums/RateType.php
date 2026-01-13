<?php

namespace App\Enums;

enum RateType: string
{
    case Hourly = 'hourly';
    case Daily = 'daily';
    case Weekly = 'weekly';
    case Monthly = 'monthly';
    case FixedProject = 'fixed_project';

    public function label(): string
    {
        return match ($this) {
            self::Hourly => 'Oraria',
            self::Daily => 'Giornaliera',
            self::Weekly => 'Settimanale',
            self::Monthly => 'Mensile',
            self::FixedProject => 'Forfait Progetto',
        };
    }

    public function unitLabel(): string
    {
        return match ($this) {
            self::Hourly => 'h',
            self::Daily => 'gg',
            self::Weekly => 'sett',
            self::Monthly => 'mese',
            self::FixedProject => 'progetto',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::Hourly => 'clock',
            self::Daily => 'calendar-days',
            self::Weekly => 'calendar-week',
            self::Monthly => 'calendar',
            self::FixedProject => 'briefcase',
        };
    }
}
