<?php

namespace App\Enums;

enum SiteMaterialStatus: string
{
    case PLANNED = 'planned';       // Pianificato
    case RESERVED = 'reserved';     // Riservato da warehouse
    case DELIVERED = 'delivered';   // Consegnato al cantiere
    case IN_USE = 'in_use';        // In utilizzo
    case COMPLETED = 'completed';   // Completato/utilizzato
    case RETURNED = 'returned';     // Restituito (parziale o totale)

    public function label(): string
    {
        return match ($this) {
            self::PLANNED => 'Pianificato',
            self::RESERVED => 'Riservato',
            self::DELIVERED => 'Consegnato',
            self::IN_USE => 'In Uso',
            self::COMPLETED => 'Completato',
            self::RETURNED => 'Restituito',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::PLANNED => 'slate',
            self::RESERVED => 'blue',
            self::DELIVERED => 'purple',
            self::IN_USE => 'amber',
            self::COMPLETED => 'green',
            self::RETURNED => 'gray',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::PLANNED => 'clipboard',
            self::RESERVED => 'lock',
            self::DELIVERED => 'truck',
            self::IN_USE => 'hammer',
            self::COMPLETED => 'check-circle',
            self::RETURNED => 'arrow-left',
        };
    }

    public function canTransitionTo(self $newStatus): bool
    {
        return match ($this) {
            self::PLANNED => in_array($newStatus, [self::RESERVED, self::DELIVERED]),
            self::RESERVED => in_array($newStatus, [self::PLANNED, self::DELIVERED]),
            self::DELIVERED => in_array($newStatus, [self::IN_USE, self::RETURNED]),
            self::IN_USE => in_array($newStatus, [self::COMPLETED, self::RETURNED]),
            self::COMPLETED => $newStatus === self::RETURNED,
            self::RETURNED => false,
        };
    }
}
