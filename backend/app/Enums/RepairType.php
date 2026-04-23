<?php

namespace App\Enums;

enum RepairType: string
{
    case Internal = 'internal';
    case External = 'external';

    public function label(): string
    {
        return match ($this) {
            self::Internal => 'Riparazione Interna',
            self::External => 'Riparazione Esterna',
        };
    }
}
