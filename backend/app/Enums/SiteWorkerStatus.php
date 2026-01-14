<?php

namespace App\Enums;

enum SiteWorkerStatus: string
{
    case Pending = 'pending';       // In attesa di risposta (solo esterni)
    case Accepted = 'accepted';     // Accettato dal collaboratore
    case Rejected = 'rejected';     // Rifiutato dal collaboratore
    case Active = 'active';         // Attualmente al lavoro
    case Completed = 'completed';   // Lavoro completato
    case Cancelled = 'cancelled';   // Assegnazione annullata
}
