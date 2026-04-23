<?php

namespace App\Enums;

enum FinalBalanceStatus: string
{
    case Draft = 'draft';
    case Finalized = 'finalized';
    case Approved = 'approved';
}
