<?php

namespace App\Enums;

enum QuantityCalculationType: string
{
    case Fixed = 'fixed';        // Quantità fissa (es: sempre 1 box)
    case Ratio = 'ratio';        // Rapporto 1:1 (es: 1 cavo per ogni smartbat)
    case Formula = 'formula';    // Formula custom (es: ceil(qty/6) per box)

    public function label(): string
    {
        return match ($this) {
            self::Fixed => 'Quantità Fissa',
            self::Ratio => 'Rapporto 1:1',
            self::Formula => 'Formula Personalizzata',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Fixed => 'La quantità è sempre fissa (es: 1)',
            self::Ratio => 'Stessa quantità del prodotto principale',
            self::Formula => 'Calcolo con formula (es: ceil(qty/6))',
        };
    }
}
