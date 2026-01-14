<?php

namespace App\Enums;

enum WorkerType: string
{
    case Employee = 'employee';
    case Freelancer = 'freelancer';
    case External = 'external';

    public function label(): string
    {
        return match ($this) {
            self::Employee => 'Dipendente',
            self::Freelancer => 'Libero Professionista',
            self::External => 'Esterno (Fornitore)',
        };
    }

    public function hasPayroll(): bool
    {
        return $this === self::Employee;
    }

    public function requiresSupplier(): bool
    {
        return $this === self::External;
    }

    public function icon(): string
    {
        return match ($this) {
            self::Employee => 'briefcase',
            self::Freelancer => 'user-check',
            self::External => 'building',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Employee => 'blue',
            self::Freelancer => 'green',
            self::External => 'purple',
        };
    }
}
