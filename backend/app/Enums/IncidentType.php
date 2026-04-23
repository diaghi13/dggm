<?php

namespace App\Enums;

enum IncidentType: string
{
    case Missing = 'missing';
    case Broken = 'broken';
    case Damaged = 'damaged';
    case Contaminated = 'contaminated';
    case LostByClient = 'lost_by_client';
    case Stolen = 'stolen';
}
