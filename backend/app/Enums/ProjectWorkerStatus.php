<?php

namespace App\Enums;

enum ProjectWorkerStatus: string
{
    case Slot = 'slot';             // Slot vuoto creato da voce preventivo, senza collaboratore assegnato
    case Pending = 'pending';       // In attesa di risposta (solo esterni)
    case Accepted = 'accepted';     // Accettato dal collaboratore
    case Rejected = 'rejected';     // Rifiutato dal collaboratore
    case Active = 'active';         // Attualmente al lavoro
    case Completed = 'completed';   // Lavoro completato
    case Cancelled = 'cancelled';   // Assegnazione annullata
}
