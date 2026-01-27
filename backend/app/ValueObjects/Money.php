<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Database\Eloquent\Castable;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

/**
 * Money Value Object (LEGGERO)
 *
 * Rappresenta un importo monetario con valuta.
 * Mantiene operazioni matematiche BASE - NO logica business complessa.
 *
 * Per calcoli complessi (markup, sconti, IVA), usa PriceCalculatorService.
 *
 * Uso nel Model:
 * protected function casts(): array {
 *     return ['price' => Money::class];
 * }
 *
 * Uso con Service:
 * $finalPrice = app(PriceCalculatorService::class)->calculateFinalPrice($product->price, $options);
 */
class Money implements Castable
{
    /**
     * @param  float  $amount  Importo (può essere negativo)
     * @param  string  $currency  Codice valuta ISO 4217 (EUR, USD, GBP, etc.)
     */
    public function __construct(
        public readonly float $amount,
        public readonly string $currency = 'EUR'
    ) {}

    /**
     * Factory methods per valute comuni
     */
    public static function EUR(float $amount): self
    {
        return new self($amount, 'EUR');
    }

    public static function USD(float $amount): self
    {
        return new self($amount, 'USD');
    }

    public static function GBP(float $amount): self
    {
        return new self($amount, 'GBP');
    }

    /**
     * Crea da array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            amount: (float) ($data['amount'] ?? 0),
            currency: $data['currency'] ?? 'EUR'
        );
    }

    /**
     * Converte ad array
     */
    public function toArray(): array
    {
        return [
            'amount' => $this->amount,
            'currency' => $this->currency,
        ];
    }

    /**
     * Somma due importi (stessa valuta)
     */
    public function add(Money $other): self
    {
        $this->ensureSameCurrency($other);

        return new self($this->amount + $other->amount, $this->currency);
    }

    /**
     * Sottrae due importi (stessa valuta)
     */
    public function subtract(Money $other): self
    {
        $this->ensureSameCurrency($other);

        return new self($this->amount - $other->amount, $this->currency);
    }

    /**
     * Moltiplica per un fattore
     */
    public function multiply(float $factor): self
    {
        return new self($this->amount * $factor, $this->currency);
    }

    /**
     * Divide per un divisore
     */
    public function divide(float $divisor): self
    {
        if ($divisor == 0) {
            throw new \InvalidArgumentException('Cannot divide by zero');
        }

        return new self($this->amount / $divisor, $this->currency);
    }

    /**
     * Predicati (metodi di verifica)
     */
    public function isZero(): bool
    {
        return $this->amount == 0;
    }

    public function isPositive(): bool
    {
        return $this->amount > 0;
    }

    public function isNegative(): bool
    {
        return $this->amount < 0;
    }

    public function isGreaterThan(Money $other): bool
    {
        $this->ensureSameCurrency($other);

        return $this->amount > $other->amount;
    }

    public function isLessThan(Money $other): bool
    {
        $this->ensureSameCurrency($other);

        return $this->amount < $other->amount;
    }

    public function equals(Money $other): bool
    {
        return $this->currency === $other->currency && $this->amount == $other->amount;
    }

    /**
     * Formattazione
     */
    public function format(bool $showCurrency = true): string
    {
        $formatted = number_format($this->amount, 2, ',', '.');

        if (! $showCurrency) {
            return $formatted;
        }

        $symbol = match ($this->currency) {
            'EUR' => '€',
            'USD' => '$',
            'GBP' => '£',
            default => $this->currency,
        };

        return $formatted.' '.$symbol;
    }

    /**
     * Converte a stringa
     */
    public function __toString(): string
    {
        return $this->format();
    }

    /**
     * Verifica stessa valuta
     */
    private function ensureSameCurrency(Money $other): void
    {
        if ($this->currency !== $other->currency) {
            throw new \InvalidArgumentException("Currency mismatch: {$this->currency} vs {$other->currency}");
        }
    }

    /**
     * Eloquent casting
     */
    public static function castUsing(array $arguments)
    {
        return new class implements CastsAttributes
        {
            public function get($model, $key, $value, $attributes)
            {
                if ($value === null) {
                    return null;
                }

                $data = json_decode($value, true);

                return new Money(
                    amount: (float) $data['amount'],
                    currency: $data['currency'] ?? 'EUR'
                );
            }

            public function set($model, $key, $value, $attributes)
            {
                if ($value === null) {
                    return null;
                }

                if (is_array($value)) {
                    $value = Money::fromArray($value);
                }

                if (is_numeric($value)) {
                    $value = new Money((float) $value, 'EUR');
                }

                if (! $value instanceof Money) {
                    throw new \InvalidArgumentException('Value must be a Money instance');
                }

                return json_encode($value->toArray());
            }
        };
    }
}
