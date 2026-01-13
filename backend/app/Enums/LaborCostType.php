<?php

namespace App\Enums;

enum LaborCostType: string
{
    case InternalLabor = 'internal_labor';
    case Subcontractor = 'subcontractor';
    case Contractor = 'contractor';

    public function label(): string
    {
        return match ($this) {
            self::InternalLabor => 'Manodopera Interna',
            self::Subcontractor => 'Subappalto',
            self::Contractor => 'Cooperativa',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::InternalLabor => 'Costi per dipendenti e freelance interni',
            self::Subcontractor => 'Costi per subappaltatori',
            self::Contractor => 'Costi per cooperative e ditte esterne',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::InternalLabor => 'user',
            self::Subcontractor => 'building',
            self::Contractor => 'users',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::InternalLabor => 'blue',
            self::Subcontractor => 'purple',
            self::Contractor => 'green',
        };
    }
}
