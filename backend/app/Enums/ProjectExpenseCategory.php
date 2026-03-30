<?php

namespace App\Enums;

enum ProjectExpenseCategory: string
{
    case Travel = 'travel';               // Viaggio/trasporto
    case Accommodation = 'accommodation'; // Alloggio
    case Meal = 'meal';                   // Pasti
    case Fuel = 'fuel';                   // Carburante
    case Toll = 'toll';                   // Pedaggi
    case Parking = 'parking';             // Parcheggio
    case Equipment = 'equipment';         // Attrezzatura/materiale extra
    case Communication = 'communication'; // Telefono/internet
    case Other = 'other';                 // Altro
}
