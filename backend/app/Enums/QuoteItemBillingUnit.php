<?php

namespace App\Enums;

enum QuoteItemBillingUnit: string
{
    case Unit = 'unit';   // standard: qty × price (default)
    case Hour = 'hour';   // orario:   qty × price × duration
    case Day = 'day';    // giornaliero: qty × price × duration (o × √duration se degressive)
    case Week = 'week';   // settimanale: qty × price × duration
    case Month = 'month';  // mensile:  qty × price × duration
    case Flat = 'flat';   // fisso:    price (qty ignorata)
}
