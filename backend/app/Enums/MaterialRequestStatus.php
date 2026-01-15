<?php

namespace App\Enums;

enum MaterialRequestStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Delivered = 'delivered';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'In Attesa',
            self::Approved => 'Approvata',
            self::Rejected => 'Rifiutata',
            self::Delivered => 'Consegnata',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending => 'yellow',
            self::Approved => 'green',
            self::Rejected => 'red',
            self::Delivered => 'blue',
        };
    }
}
