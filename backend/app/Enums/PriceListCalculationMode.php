<?php

namespace App\Enums;

enum PriceListCalculationMode: string
{
    case Automatic = 'automatic';
    case Manual = 'manual';
}
