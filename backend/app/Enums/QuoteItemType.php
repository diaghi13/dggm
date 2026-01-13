<?php

namespace App\Enums;

enum QuoteItemType: string
{
    case Section = 'section';
    case Item = 'item';
    case Labor = 'labor';
    case Material = 'material';
}
