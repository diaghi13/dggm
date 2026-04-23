<?php

namespace App\Enums;

enum AvailabilityResolution: string
{
    case None = 'none';
    case ReserveExisting = 'reserve_existing';
    case Subrental = 'subrental';
    case RemoveFromProject = 'remove_from_project';
}
