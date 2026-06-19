<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Database\Eloquent\Castable;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

/**
 * Percentage Value Object
 *
 * Rappresenta una percentuale con operazioni matematiche.
 *
 * Utile per:
 * - Sconti (discount_percentage)
 * - IVA (vat_rate)
 * - Ricarichi (markup)
 * - Avanzamento lavori (completion_percentage)
 * - Margini (profit_margin)
 *
 * Uso nel Model:
 * protected function casts(): array {
 *     return [
 *         'discount' => Percentage::class,
 *         'vat_rate' => Percentage::class,
 *     ];
 * }
 *
 * Uso:
 * $product->discount->applyTo(Money::EUR(100)) // Money(80, EUR) se 20%
 * $product->discount->format() // "20%"
 * $product->discount->asDecimal() // 0.20
 */
class Percentage implements Castable
{
    /**
     * @param  float  $value  Valore percentuale (0-100)
     */
    public function __construct(
        public readonly float $value
    ) {
        if ($value < 0 || $value > 100) {
            throw new \InvalidArgumentException('Percentage must be between 0 and 100');
        }
    }

    /**
     * Crea da decimale (es: 0.22  22%)
     */
    public static function fromDecimal(float $decimal): self
    {
        return new self($decimal * 100);
    }

    /**
     * Crea da frazione (es: 1/4  25%)
     */
    public static function fromFraction(float $numerator, float $denominator): self
    {
        if ($denominator == 0) {
            throw new \InvalidArgumentException('Denominator cannot be zero');
        }

        return new self(($numerator / $denominator) * 100);
    }

    /**
     * Converte a decimale (es: 22%  0.22)
     */
    public function asDecimal(): float
    {
        return $this->value / 100;
    }

    /**
     * Applica percentuale ad un importo Money
     *
     * @param  Money  $amount  Importo base
     * @param  bool  $subtract  Se true, sottrae la percentuale (es: sconto), altrimenti aggiunge (es: IVA)
     */
    public function applyTo(Money $amount, bool $subtract = true): Money
    {
        $percentage = $amount->percentage($this->value);

        return $subtract
            ? $amount->subtract($percentage)
            : $amount->add($percentage);
    }

    /**
     * Calcola la percentuale di un importo (es: 20% di 100 = 20)
     */
    public function of(Money $amount): Money
    {
        return $amount->percentage($this->value);
    }

    /**
     * Calcola la percentuale di un numero (es: 20% di 100 = 20)
     */
    public function ofNumber(float $number): float
    {
        return $number * $this->asDecimal();
    }

    /**
     * Inverti la percentuale (100 - value)
     * Es: 30%  70%
     */
    public function invert(): self
    {
        return new self(100 - $this->value);
    }

    /**
     * Somma due percentuali
     * ATTENZIONE: somma lineare, non composta!
     */
    public function add(Percentage $other): self
    {
        $newValue = $this->value + $other->value;

        if ($newValue > 100) {
            throw new \InvalidArgumentException('Sum of percentages cannot exceed 100%');
        }

        return new self($newValue);
    }

    /**
     * Sottrae percentuali
     */
    public function subtract(Percentage $other): self
    {
        $newValue = $this->value - $other->value;

        if ($newValue < 0) {
            throw new \InvalidArgumentException('Percentage cannot be negative');
        }

        return new self($newValue);
    }

    /**
     * Moltiplica la percentuale (es: 50% * 0.5 = 25%)
     */
    public function multiply(float $multiplier): self
    {
        return new self($this->value * $multiplier);
    }

    /**
     * Verifica se è zero
     */
    public function isZero(): bool
    {
        return abs($this->value) < 0.01;
    }

    /**
     * Verifica se è 100%
     */
    public function isFull(): bool
    {
        return abs($this->value - 100) < 0.01;
    }

    /**
     * Verifica se è maggiore di altra percentuale
     */
    public function isGreaterThan(Percentage $other): bool
    {
        return $this->value > $other->value;
    }

    /**
     * Verifica se è minore di altra percentuale
     */
    public function isLessThan(Percentage $other): bool
    {
        return $this->value < $other->value;
    }

    /**
     * Verifica se è uguale ad altra percentuale
     */
    public function equals(Percentage $other, float $tolerance = 0.01): bool
    {
        return abs($this->value - $other->value) < $tolerance;
    }

    /**
     * Formatta per display
     */
    public function format(int $decimals = 2): string
    {
        return number_format($this->value, $decimals, ',', '.').'%';
    }

    /**
     * Converte a stringa
     */
    public function __toString(): string
    {
        return $this->format();
    }

    /**
     * Converte ad array
     */
    public function toArray(): array
    {
        return [
            'value' => $this->value,
            'decimal' => $this->asDecimal(),
            'formatted' => $this->format(),
        ];
    }

    /**
     * Casi comuni predefiniti
     */
    public static function vat(): self
    {
        return new self(22); // IVA italiana standard
    }

    public static function reducedVat(): self
    {
        return new self(10); // IVA ridotta
    }

    public static function superReducedVat(): self
    {
        return new self(4); // IVA super ridotta
    }

    public static function zero(): self
    {
        return new self(0);
    }

    public static function full(): self
    {
        return new self(100);
    }

    /**
     * Eloquent Cast Implementation
     */
    public static function castUsing(array $arguments): CastsAttributes
    {
        return new class implements CastsAttributes
        {
            public function get($model, string $key, $value, array $attributes): ?Percentage
            {
                if (is_null($value)) {
                    return null;
                }

                if ($value instanceof Percentage) {
                    return $value;
                }

                return new Percentage((float) $value);
            }

            public function set($model, string $key, $value, array $attributes): array
            {
                if (is_null($value)) {
                    return [$key => null];
                }

                if (is_numeric($value)) {
                    $value = new Percentage((float) $value);
                }

                if (! $value instanceof Percentage) {
                    throw new \InvalidArgumentException('Value must be a Percentage instance');
                }

                return [$key => $value->value];
            }
        };
    }
}
