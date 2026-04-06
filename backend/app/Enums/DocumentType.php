<?php

namespace App\Enums;

enum DocumentType: string
{
    case Quote = 'quote';
    case Invoice = 'invoice';
    case Ddt = 'ddt';
    case Sal = 'sal';
    case Invitation = 'invitation';
    case Generic = 'generic';
}
