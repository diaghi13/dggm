<?php

namespace App\Enums;

enum ReturnReason: string
{
    case Defective = 'defective'; // Materiale difettoso
    case WrongItem = 'wrong_item'; // Articolo sbagliato
    case Excess = 'excess'; // Materiale in eccesso/avanzato
    case Warranty = 'warranty'; // Garanzia
    case CustomerDissatisfaction = 'customer_dissatisfaction'; // Insoddisfazione cliente
    case Other = 'other'; // Altro motivo
}
