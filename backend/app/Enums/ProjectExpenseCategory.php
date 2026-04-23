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
    case MileageReimbursement = 'mileage_reimbursement'; // Rimborso chilometrico
    case Flight = 'flight';               // Aereo
    case Train = 'train';                 // Treno
    case Ferry = 'ferry';                 // Traghetto
    case Taxi = 'taxi';                   // Taxi/NCC
    case EquipmentRental = 'equipment_rental'; // Noleggio attrezzatura
    case Other = 'other';                 // Altro
}
