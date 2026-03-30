<?php

namespace App\Enums;

enum ProjectScheduleDayStatus: string
{
    case Pending = 'pending';       // In attesa di risposta dal collaboratore
    case Accepted = 'accepted';     // Giorno confermato dal collaboratore
    case Rejected = 'rejected';     // Giorno rifiutato dal collaboratore
    case Modified = 'modified';     // PM ha modificato dopo l'accettazione (richiede ri-accettazione se configurato)
    case Completed = 'completed';   // Giorno completato
    case Cancelled = 'cancelled';   // Giorno annullato
}
