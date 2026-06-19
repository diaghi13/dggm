<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Database\Eloquent\Castable;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

/**
 * Address Value Object
 *
 * Rappresenta un indirizzo completo con validazioni e operazioni.
 *
 * Vantaggi:
 * - Immutabile (readonly properties)
 * - Type-safe
 * - Logica centralizzata (formattazione, validazione)
 * - Riutilizzabile in: Warehouse, Site, Customer, Supplier
 *
 * Uso nel Model:
 * protected function casts(): array {
 *     return ['address' => Address::class];
 * }
 *
 * Uso:
 * $warehouse->address->toString()
 * $warehouse->address->isComplete()
 * $warehouse->address->isInProvince('MI')
 */
class Address implements Castable
{
    /**
     * @param  string|null  $street  Via/Corso/Piazza
     * @param  string|null  $city  Città
     * @param  string|null  $province  Sigla provincia (MI, RM, TO, etc.)
     * @param  string|null  $postalCode  CAP
     * @param  string|null  $country  Paese (default: IT)
     */
    public function __construct(
        public readonly ?string $street,
        public readonly ?string $city,
        public readonly ?string $province,
        public readonly ?string $postalCode,
        public readonly string $country = 'IT'
    ) {}

    /**
     * Crea da array (es: da database)
     */
    public static function fromArray(array $data): self
    {
        return new self(
            street: $data['street'] ?? null,
            city: $data['city'] ?? null,
            province: $data['province'] ?? null,
            postalCode: $data['postal_code'] ?? null,
            country: $data['country'] ?? 'IT'
        );
    }

    /**
     * Crea da stringa separata (es: "Via Roma, 20121, Milano, MI")
     */
    public static function fromString(string $address): self
    {
        $parts = array_map('trim', explode(',', $address));

        return new self(
            street: $parts[0] ?? null,
            city: $parts[2] ?? null,
            province: $parts[3] ?? null,
            postalCode: $parts[1] ?? null
        );
    }

    /**
     * Converte a stringa formattata
     */
    public function toString(): string
    {
        $parts = array_filter([
            $this->street,
            $this->postalCode,
            $this->city,
            $this->province ? "({$this->province})" : null,
        ]);

        return implode(', ', $parts);
    }

    /**
     * Converte a stringa quando usato come string
     */
    public function __toString(): string
    {
        return $this->toString();
    }

    /**
     * Converte ad array (per serializzazione)
     */
    public function toArray(): array
    {
        return [
            'street' => $this->street,
            'city' => $this->city,
            'province' => $this->province,
            'postal_code' => $this->postalCode,
            'country' => $this->country,
        ];
    }

    /**
     * Verifica se l'indirizzo è completo
     */
    public function isComplete(): bool
    {
        return ! empty($this->street)
            && ! empty($this->city)
            && ! empty($this->postalCode);
    }

    /**
     * Verifica se è nella provincia specificata
     */
    public function isInProvince(string $province): bool
    {
        return strtoupper($this->province ?? '') === strtoupper($province);
    }

    /**
     * Verifica se è nella città specificata
     */
    public function isInCity(string $city): bool
    {
        return strcasecmp($this->city ?? '', $city) === 0;
    }

    /**
     * Ottiene l'indirizzo formattato per Google Maps URL
     */
    public function toGoogleMapsUrl(): string
    {
        return 'https://www.google.com/maps/search/?api=1&query='.urlencode($this->toString());
    }

    /**
     * Ottiene solo città e provincia (formato breve)
     */
    public function toShortString(): string
    {
        $parts = array_filter([
            $this->city,
            $this->province ? "({$this->province})" : null,
        ]);

        return implode(' ', $parts);
    }

    /**
     * Eloquent Cast Implementation
     */
    public static function castUsing(array $arguments): CastsAttributes
    {
        return new class implements CastsAttributes
        {
            public function get($model, string $key, $value, array $attributes): ?Address
            {
                if (is_null($value)) {
                    return null;
                }

                // Se è già un Address, restituiscilo
                if ($value instanceof Address) {
                    return $value;
                }

                // Crea Address dai campi individuali del model
                return new Address(
                    street: $attributes['address'] ?? null,
                    city: $attributes['city'] ?? null,
                    province: $attributes['province'] ?? null,
                    postalCode: $attributes['postal_code'] ?? null,
                    country: $attributes['country'] ?? 'IT'
                );
            }

            public function set($model, string $key, $value, array $attributes): array
            {
                if (is_null($value)) {
                    return [
                        'address' => null,
                        'city' => null,
                        'province' => null,
                        'postal_code' => null,
                        'country' => 'IT',
                    ];
                }

                if (is_array($value)) {
                    $value = Address::fromArray($value);
                }

                if (! $value instanceof Address) {
                    throw new \InvalidArgumentException('Value must be an Address instance');
                }

                return [
                    'address' => $value->street,
                    'city' => $value->city,
                    'province' => $value->province,
                    'postal_code' => $value->postalCode,
                    'country' => $value->country,
                ];
            }
        };
    }
}
