<?php

namespace App\Enums;

enum PriceListAdjustmentType: string
{
    case Percentage = 'percentage';
    case Fixed = 'fixed';
    case None = 'none';
    case Multiplier = 'multiplier';
}
