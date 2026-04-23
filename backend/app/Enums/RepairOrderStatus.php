<?php

namespace App\Enums;

enum RepairOrderStatus: string
{
    case Pending = 'pending';
    case SentExternal = 'sent_external';
    case InRepair = 'in_repair';
    case Completed = 'completed';
    case Unrepairable = 'unrepairable';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'In Attesa',
            self::SentExternal => 'Inviato Esterno',
            self::InRepair => 'In Riparazione',
            self::Completed => 'Completato',
            self::Unrepairable => 'Non Riparabile',
        };
    }

    public function isTerminal(): bool
    {
        return in_array($this, [self::Completed, self::Unrepairable]);
    }
}
