<?php

namespace App\Enums;

enum KitAssemblyStatus: string
{
    case Assembled = 'assembled';
    case InUse = 'in_use';
    case Returned = 'returned';
    case Disassembled = 'disassembled';

    public function label(): string
    {
        return match ($this) {
            self::Assembled => 'Assemblato',
            self::InUse => 'In Uso',
            self::Returned => 'Rientrato',
            self::Disassembled => 'Smontato',
        };
    }

    public function colorClass(): string
    {
        return match ($this) {
            self::Assembled => 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
            self::InUse => 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
            self::Returned => 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
            self::Disassembled => 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        };
    }

    public function isActive(): bool
    {
        return in_array($this, [self::Assembled, self::InUse, self::Returned]);
    }
}
