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
 */
enum ProductType: string
{
    case ARTICLE = 'article';       // Articolo fisico inventoriabile
    case SERVICE = 'service';        // Servizio non inventoriabile
    case COMPOSITE = 'composite';    // Prodotto composto (può contenere articoli, servizi, altri composti)

    public function label(): string
    {
        return match ($this) {
            self::ARTICLE => 'Articolo',
            self::SERVICE => 'Servizio',
            self::COMPOSITE => 'Prodotto Composto',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::ARTICLE => 'Prodotto fisico inventoriabile (es: cemento, cavi, attrezzi)',
            self::SERVICE => 'Servizio non inventoriabile (es: manodopera, consulenza, installazione)',
            self::COMPOSITE => 'Prodotto composto da articoli, servizi o altri prodotti composti',
        };
    }

    public function isInventoriable(): bool
    {
        return $this === self::ARTICLE;
    }

    public function canHaveComponents(): bool
    {
        return $this === self::COMPOSITE;
    }

    public function canBeComponent(): bool
    {
        // All types can be components of COMPOSITE products
        return true;
    }

    public function icon(): string
    {
        return match ($this) {
            self::ARTICLE => 'box',
            self::SERVICE => 'briefcase',
            self::COMPOSITE => 'package',
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
        };
    }
}

// Backward compatibility alias (temporary - remove dopo refactoring completo)
class_alias(ProductType::class, 'App\Enums\MaterialType');
