<?php

namespace App\Enums;

enum InspectionItemAction: string
{
    case ReturnToStock = 'return_to_stock';
    case Quarantine = 'quarantine';
    case WriteOff = 'write_off';

    public function label(): string
    {
        return match ($this) {
            self::ReturnToStock => 'Ritorno a magazzino',
            self::Quarantine => 'Quarantena',
            self::WriteOff => 'Rottamazione',
        };
    }
}
