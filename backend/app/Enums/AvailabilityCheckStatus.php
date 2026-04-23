<?php

namespace App\Enums;

enum AvailabilityCheckStatus: string
{
    case Pending = 'pending';
    case Completed = 'completed';
    case Resolved = 'resolved';
}
