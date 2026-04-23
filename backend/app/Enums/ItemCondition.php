<?php

namespace App\Enums;

enum ItemCondition: string
{
    case Good = 'good';
    case MinorDamage = 'minor_damage';
    case MajorDamage = 'major_damage';
    case WriteOff = 'write_off';

    public function label(): string
    {
        return match ($this) {
            self::Good => 'Buono',
            self::MinorDamage => 'Danno lieve',
            self::MajorDamage => 'Danno grave',
            self::WriteOff => 'Fuori uso',
        };
    }
}
