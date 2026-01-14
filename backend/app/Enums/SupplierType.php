<?php

namespace App\Enums;

enum SupplierType: string
{
    case Materials = 'materials';
    case Personnel = 'personnel';
    case Both = 'both';

    public function label(): string
    {
        return match ($this) {
            self::Materials => 'Materiali',
            self::Personnel => 'Personale',
            self::Both => 'Materiali e Personale',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::Materials => 'package',
            self::Personnel => 'users',
            self::Both => 'layers',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Materials => 'blue',
            self::Personnel => 'green',
            self::Both => 'purple',
        };
    }

    public function providesMaterials(): bool
    {
        return $this === self::Materials || $this === self::Both;
    }

    public function providesPersonnel(): bool
    {
        return $this === self::Personnel || $this === self::Both;
    }
}
