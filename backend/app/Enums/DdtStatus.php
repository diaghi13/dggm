<?php

namespace App\Enums;

enum DdtStatus: string
{
    case Draft = 'draft'; // Bozza
    case Issued = 'issued'; // Emesso
    case InTransit = 'in_transit'; // In transito
    case Delivered = 'delivered'; // Consegnato
    case Cancelled = 'cancelled'; // Annullato
}
