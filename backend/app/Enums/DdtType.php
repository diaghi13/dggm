<?php

namespace App\Enums;

enum DdtType: string
{
    case Incoming = 'incoming'; // DDT fornitore (carico da acquisto)
    case Outgoing = 'outgoing'; // DDT nostro (scarico verso cantiere/cliente)
    case Internal = 'internal'; // DDT trasferimento tra magazzini
    case RentalOut = 'rental_out'; // DDT noleggio uscita (materiale in prestito)
    case RentalReturn = 'rental_return'; // DDT noleggio rientro (restituzione)
    case ReturnFromCustomer = 'return_from_customer'; // Reso da cliente (difetto/insoddisfazione)
    case ReturnToSupplier = 'return_to_supplier'; // Reso a fornitore (materiale difettoso)
}
