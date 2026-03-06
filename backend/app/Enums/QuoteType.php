<?php

namespace App\Enums;

enum QuoteType: string
{
    case Sale = 'sale';
    case Rental = 'rental';
    case Event = 'event';
}
