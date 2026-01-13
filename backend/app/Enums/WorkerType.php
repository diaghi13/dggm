<?php

namespace App\Enums;

enum WorkerType: string
{
    case Employee = 'employee';
    case Freelancer = 'freelancer';
    case ContractorCompany = 'contractor_company';

    public function label(): string
    {
        return match ($this) {
            self::Employee => 'Dipendente',
            self::Freelancer => 'Libero Professionista',
            self::ContractorCompany => 'Cooperativa/Ditta',
        };
    }

    public function hasPayroll(): bool
    {
        return $this === self::Employee;
    }

    public function requiresContractor(): bool
    {
        return $this === self::ContractorCompany;
    }

    public function icon(): string
    {
        return match ($this) {
            self::Employee => 'briefcase',
            self::Freelancer => 'user-check',
            self::ContractorCompany => 'building',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Employee => 'blue',
            self::Freelancer => 'green',
            self::ContractorCompany => 'purple',
        };
    }
}
