<?php

namespace App\Enums;

/**
 * ProductType Enum
 *
 * Renamed from MaterialType to reflect correct terminology.
 * Products can be:
 * - ARTICLE: Physical inventoriable items (ex: cement, cables, tools)
 * - SERVICE: Non-inventoriable services (ex: labor, consulting, installation)
 * - COMPOSITE: Composed products that can contain articles, services, or other composites
 * - KIT: Operational assembly with lifecycle (distributed or physically assembled)
 */
enum ProductType: string
{
    case ARTICLE = 'article';       // Articolo fisico inventoriabile
    case SERVICE = 'service';        // Servizio non inventoriabile
    case COMPOSITE = 'composite';    // Prodotto composto (può contenere articoli, servizi, altri composti)
    case KIT = 'kit';               // Assembly operativa con lifecycle (distribuita o assemblata fisicamente)

    public function label(): string
    {
        return match ($this) {
            self::ARTICLE => 'Articolo',
            self::SERVICE => 'Servizio',
            self::COMPOSITE => 'Prodotto Composto',
            self::KIT => 'Kit',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::ARTICLE => 'Prodotto fisico inventoriabile (es: cemento, cavi, attrezzi)',
            self::SERVICE => 'Servizio non inventoriabile (es: manodopera, consulenza, installazione)',
            self::COMPOSITE => 'Prodotto composto da articoli, servizi o altri prodotti composti',
            self::KIT => 'Assembly operativa con lifecycle: distribuita (impianto audio) o assemblata (rack in case)',
        };
    }

    public function isInventoriable(): bool
    {
        return $this === self::ARTICLE;
    }

    public function canHaveComponents(): bool
    {
        return in_array($this, [self::COMPOSITE, self::KIT]);
    }

    public function canBeComponent(): bool
    {
        // All types can be components of COMPOSITE/KIT products
        return true;
    }

    public function isKit(): bool
    {
        return $this === self::KIT;
    }

    public function icon(): string
    {
        return match ($this) {
            self::ARTICLE => 'box',
            self::SERVICE => 'briefcase',
            self::COMPOSITE => 'package',
            self::KIT => 'layers',
        };
    }

    /**
     * Get color class for UI badges
     */
    public function colorClass(): string
    {
        return match ($this) {
            self::ARTICLE => 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
            self::SERVICE => 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
            self::COMPOSITE => 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
            self::KIT => 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
        };
    }
}

// Backward compatibility alias (temporary - remove dopo refactoring completo)
class_alias(ProductType::class, 'App\Enums\MaterialType');
