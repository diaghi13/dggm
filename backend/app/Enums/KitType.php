<?php

namespace App\Enums;

enum KitType: string
{
    case Distributed = 'distributed'; // Componenti in posizioni diverse, nessuna unità fisica kit
    case Assembled = 'assembled';   // Assembly fisica: componenti consumati, kit tracciato come unità

    public function label(): string
    {
        return match ($this) {
            self::Distributed => 'Distribuito',
            self::Assembled => 'Assemblato',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Distributed => 'Componenti in posizioni diverse, caricati separatamente (es. impianto audio)',
            self::Assembled => 'Assembly fisica in un case/contenitore, tracciata come unità in magazzino (es. rack microfonico)',
        };
    }
}
