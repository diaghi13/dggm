<?php

namespace App\Enums;

enum MaterialType: string
{
    case PHYSICAL = 'physical'; // Prodotto fisico inventoriabile
    case SERVICE = 'service';   // Servizio non inventoriabile
    case KIT = 'kit';          // Kit/composizione

    public function label(): string
    {
        return match ($this) {
            self::PHYSICAL => 'Prodotto Fisico',
            self::SERVICE => 'Servizio',
            self::KIT => 'Kit/Composizione',
        };
    }

    public function isInventoriable(): bool
    {
        return $this === self::PHYSICAL;
    }

    public function icon(): string
    {
        return match ($this) {
            self::PHYSICAL => 'box',
            self::SERVICE => 'briefcase',
            self::KIT => 'package',
        };
    }
}
