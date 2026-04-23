<?php

namespace App\Enums;

enum IncidentStatus: string
{
    case Open = 'open';
    case Reviewed = 'reviewed';
    case Resolved = 'resolved';
    case Invoiced = 'invoiced';
}
