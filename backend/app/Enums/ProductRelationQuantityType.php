<?php

namespace App\Enums;

enum ProductRelationQuantityType: string
{
    case FIXED = 'fixed';
    case MULTIPLIED = 'multiplied';
    case FORMULA = 'formula';

    public function label(): string
    {
        return match ($this) {
            self::FIXED => 'Quantità Fissa',
            self::MULTIPLIED => 'Moltiplicata',
            self::FORMULA => 'Formula Personalizzata',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::FIXED => 'La quantità è sempre fissa (es: sempre 2 viti per articolo)',
            self::MULTIPLIED => 'La quantità viene moltiplicata per quella del prodotto parent (es: qty * 2)',
            self::FORMULA => 'Calcolo con formula PHP (es: ceil(qty/6) per bauli)',
        };
    }

    public function example(): string
    {
        return match ($this) {
            self::FIXED => 'quantity_value = "2" → sempre 2',
            self::MULTIPLIED => 'quantity_value = "2" → qty parent * 2',
            self::FORMULA => 'quantity_value = "ceil(qty/6)" → arrotonda per eccesso',
        };
    }
}
