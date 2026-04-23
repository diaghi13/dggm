<?php

namespace App\Enums;

enum ProjectServiceBillingUnit: string
{
    case Hour = 'hour';
    case Day = 'day';
    case Flat = 'flat';
}
