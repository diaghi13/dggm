<?php

namespace App\Enums;

enum ContractType: string
{
    case Permanent = 'permanent';
    case FixedTerm = 'fixed_term';
    case Seasonal = 'seasonal';
    case ProjectBased = 'project_based';
    case Internship = 'internship';

    public function label(): string
    {
        return match ($this) {
            self::Permanent => 'Tempo Indeterminato',
            self::FixedTerm => 'Tempo Determinato',
            self::Seasonal => 'Stagionale',
            self::ProjectBased => 'A Progetto',
            self::Internship => 'Apprendistato/Stage',
        };
    }

    public function requiresEndDate(): bool
    {
        return in_array($this, [
            self::FixedTerm,
            self::Seasonal,
            self::ProjectBased,
        ]);
    }

    public function color(): string
    {
        return match ($this) {
            self::Permanent => 'blue',
            self::FixedTerm => 'yellow',
            self::Seasonal => 'orange',
            self::ProjectBased => 'purple',
            self::Internship => 'green',
        };
    }
}
