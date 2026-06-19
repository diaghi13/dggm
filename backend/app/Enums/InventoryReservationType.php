<?php

namespace App\Enums;

enum InventoryReservationType: string
{
    case RentalBooking = 'rental_booking';       // Prenotazione noleggio (DDT futuro)
    case ProjectMaterial = 'project_material';   // Materiale pianificato per cantiere
    case SaleOrder = 'sale_order';               // Ordine di vendita confermato
}
