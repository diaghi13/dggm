<?php

namespace App\Enums;

enum PersonnelType: string
{
    case Cooperative = 'cooperative';
    case StaffingAgency = 'staffing_agency';
    case RentalWithOperator = 'rental_with_operator';
    case Subcontractor = 'subcontractor';
    case TechnicalServices = 'technical_services';

    public function label(): string
    {
        return match ($this) {
            self::Cooperative => 'Cooperativa',
            self::StaffingAgency => 'Agenzia Interinale',
            self::RentalWithOperator => 'Noleggio con Operatore',
            self::Subcontractor => 'Subappaltatore',
            self::TechnicalServices => 'Servizi Tecnici',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::Cooperative => 'users',
            self::StaffingAgency => 'user-cog',
            self::RentalWithOperator => 'truck',
            self::Subcontractor => 'building-2',
            self::TechnicalServices => 'wrench',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Cooperative => 'blue',
            self::StaffingAgency => 'green',
            self::RentalWithOperator => 'orange',
            self::Subcontractor => 'purple',
            self::TechnicalServices => 'indigo',
        };
    }
}
