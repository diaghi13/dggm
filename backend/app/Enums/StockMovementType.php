<?php

namespace App\Enums;

enum StockMovementType: string
{
    case INTAKE = 'intake';                    // Carico merce (da fornitore)
    case OUTPUT = 'output';                    // Scarico vendita
    case TRANSFER = 'transfer';                // Trasferimento tra magazzini
    case ADJUSTMENT = 'adjustment';            // Rettifica inventario
    case RETURN = 'return';                    // Reso da cantiere/cliente
    case WASTE = 'waste';                      // Scarto/perdita
    case RENTAL_OUT = 'rental_out';           // Noleggio - uscita
    case RENTAL_RETURN = 'rental_return';     // Noleggio - rientro
    case SITE_ALLOCATION = 'site_allocation'; // Assegnazione a cantiere
    case SITE_RETURN = 'site_return';         // Rientro da cantiere
    case KIT_ASSEMBLY = 'kit_assembly';       // Assemblaggio kit (componenti scalati)
    case KIT_DISASSEMBLY = 'kit_disassembly'; // Smontaggio kit (componenti ripristinati)

    public function label(): string
    {
        return match ($this) {
            self::INTAKE => 'Carico Merce',
            self::OUTPUT => 'Scarico Vendita',
            self::TRANSFER => 'Trasferimento',
            self::ADJUSTMENT => 'Rettifica Inventario',
            self::RETURN => 'Reso',
            self::WASTE => 'Scarto/Perdita',
            self::RENTAL_OUT => 'Noleggio Uscita',
            self::RENTAL_RETURN => 'Noleggio Rientro',
            self::SITE_ALLOCATION => 'Assegnazione Cantiere',
            self::SITE_RETURN => 'Rientro da Cantiere',
            self::KIT_ASSEMBLY => 'Assemblaggio Kit',
            self::KIT_DISASSEMBLY => 'Smontaggio Kit',
        };
    }

    public function isOutgoing(): bool
    {
        return in_array($this, [
            self::OUTPUT,
            self::WASTE,
            self::RENTAL_OUT,
            self::SITE_ALLOCATION,
            self::KIT_ASSEMBLY,
        ]);
    }

    public function isIncoming(): bool
    {
        return in_array($this, [
            self::INTAKE,
            self::RETURN,
            self::RENTAL_RETURN,
            self::SITE_RETURN,
            self::KIT_DISASSEMBLY,
        ]);
    }

    public function affectsStock(): bool
    {
        return $this !== self::TRANSFER;
    }

    public function color(): string
    {
        return match ($this) {
            self::INTAKE, self::RETURN, self::RENTAL_RETURN, self::SITE_RETURN, self::KIT_DISASSEMBLY => 'green',
            self::OUTPUT, self::RENTAL_OUT, self::SITE_ALLOCATION, self::KIT_ASSEMBLY => 'blue',
            self::WASTE => 'red',
            self::ADJUSTMENT => 'amber',
            self::TRANSFER => 'purple',
        };
    }
}
