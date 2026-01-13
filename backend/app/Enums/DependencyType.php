<?php

namespace App\Enums;

enum DependencyType: string
{
    case Container = 'container';      // Box, flight case, baule
    case Accessory = 'accessory';      // Accessori necessari
    case Cable = 'cable';              // Cavi di alimentazione/segnale
    case Consumable = 'consumable';    // Materiali consumabili
    case Tool = 'tool';                // Attrezzi necessari

    public function label(): string
    {
        return match ($this) {
            self::Container => 'Contenitore',
            self::Accessory => 'Accessorio',
            self::Cable => 'Cavo',
            self::Consumable => 'Consumabile',
            self::Tool => 'Attrezzo',
        };
    }
}
