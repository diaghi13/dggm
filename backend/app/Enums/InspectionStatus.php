<?php

namespace App\Enums;

enum InspectionStatus: string
{
    case InProgress = 'in_progress';
    case Completed = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::InProgress => 'In corso',
            self::Completed => 'Completata',
        };
    }
}
