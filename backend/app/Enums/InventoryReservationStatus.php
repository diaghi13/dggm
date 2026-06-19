<?php

namespace App\Enums;

enum InventoryReservationStatus: string
{
    case Pending = 'pending';         // Creata, non ancora confermata
    case Confirmed = 'confirmed';     // Confermata — blocca la disponibilità
    case Active = 'active';           // In corso (DDT emesso / cantiere avviato)
    case Completed = 'completed';     // Conclusa (materiale restituito / consegnato)
    case Cancelled = 'cancelled';     // Annullata

    public function blocksAvailability(): bool
    {
        return in_array($this, [self::Confirmed, self::Active]);
    }
}
