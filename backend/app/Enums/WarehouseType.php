<?php

namespace App\Enums;

enum WarehouseType: string
{
    case CENTRAL = 'central';           // Magazzino centrale
    case SITE_STORAGE = 'site_storage'; // Deposito cantiere
    case MOBILE_TRUCK = 'mobile_truck'; // Camion/furgone mobile

    public function label(): string
    {
        return match ($this) {
            self::CENTRAL => 'Magazzino Centrale',
            self::SITE_STORAGE => 'Deposito Cantiere',
            self::MOBILE_TRUCK => 'Mezzo Mobile',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::CENTRAL => 'warehouse',
            self::SITE_STORAGE => 'building',
            self::MOBILE_TRUCK => 'truck',
        };
    }

    public function isFixed(): bool
    {
        return $this !== self::MOBILE_TRUCK;
    }
}
