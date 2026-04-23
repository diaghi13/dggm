<?php

namespace App\Enums;

enum AvailabilityStatus: string
{
    case Available = 'available';
    case Partial = 'partial';
    case Unavailable = 'unavailable';
}
