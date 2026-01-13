<?php

namespace App\Enums;

enum ContractorType: string
{
    case Cooperative = 'cooperative';
    case Subcontractor = 'subcontractor';
    case TemporaryAgency = 'temporary_agency';

    public function label(): string
    {
        return match ($this) {
            self::Cooperative => 'Cooperativa',
            self::Subcontractor => 'Subappaltatore',
            self::TemporaryAgency => 'Agenzia Interinale',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::Cooperative => 'users',
            self::Subcontractor => 'building-2',
            self::TemporaryAgency => 'user-cog',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Cooperative => 'blue',
            self::Subcontractor => 'purple',
            self::TemporaryAgency => 'green',
        };
    }
}
