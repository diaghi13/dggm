<?php

namespace App\Enums;

enum FinalBalanceItemType: string
{
    case Section = 'section';
    case Material = 'material';
    case Labor = 'labor';
    case Expense = 'expense';
    case Service = 'service';
    case Damage = 'damage';
    case Transport = 'transport';
    case QuoteReference = 'quote_reference';
    case Other = 'other';
}
