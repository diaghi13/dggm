<?php

namespace App\Enums;

enum PriceListAppliesTo: string
{
    case Sale = 'sale';
    case Rental = 'rental';
    case Both = 'both';
}
