<?php

namespace App\Enums;

enum DamageSeverity: string
{
    case Minor = 'minor';
    case Major = 'major';
    case WriteOff = 'write_off';
}
