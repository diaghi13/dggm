<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Database\Eloquent\Castable;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

/**
 * Coordinates Value Object (LEGGERO)
 *
 * Rappresenta una posizione geografica GPS (latitudine/longitudine).
 * Solo validazione e conversione - NO logica complessa.
 *
 * Per logica GPS complessa (distanze, validazioni), usa GeolocationService.
 *
 * Uso nel Model:
 * protected function casts(): array {
 *     return ['location' => Coordinates::class];
 * }
 *
 * Uso con Service:
 * $distance = app(GeolocationService::class)->calculateDistance($site->location, $worker->location);
 */
class Coordinates implements Castable
{
    /**
     * @param  float  $latitude  Latitudine (-90 a +90)
     * @param  float  $longitude  Longitudine (-180 a +180)
     */
    public function __construct(
        public readonly float $latitude,
        public readonly float $longitude
    ) {
        $this->validate();
    }

    /**
     * Crea da array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            latitude: (float) ($data['latitude'] ?? $data['lat'] ?? 0),
            longitude: (float) ($data['longitude'] ?? $data['lng'] ?? $data['lon'] ?? 0)
        );
    }

    /**
     * Crea da stringa "lat,lng" (es: "45.4642,9.1900")
     */
    public static function fromString(string $coordinates): self
    {
        $parts = array_map('trim', explode(',', $coordinates));

        if (count($parts) !== 2) {
            throw new \InvalidArgumentException('Invalid coordinates format. Expected "latitude,longitude"');
        }

        return new self((float) $parts[0], (float) $parts[1]);
    }

    /**
     * Converte ad array
     */
    public function toArray(): array
    {
        return [
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
        ];
    }

    /**
     * Converte a stringa "lat,lng"
     */
    public function toString(): string
    {
        return "{$this->latitude},{$this->longitude}";
    }

    /**
     * Converte a stringa
     */
    public function __toString(): string
    {
        return $this->toString();
    }

    /**
     * URL Google Maps per questa posizione
     */
    public function toGoogleMapsUrl(): string
    {
        return "https://www.google.com/maps?q={$this->latitude},{$this->longitude}";
    }

    /**
     * Validazione coordinate
     */
    private function validate(): void
    {
        if ($this->latitude < -90 || $this->latitude > 90) {
            throw new \InvalidArgumentException('Latitude must be between -90 and 90');
        }

        if ($this->longitude < -180 || $this->longitude > 180) {
            throw new \InvalidArgumentException('Longitude must be between -180 and 180');
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

                return new Coordinates(
                    latitude: (float) $data['latitude'],
                    longitude: (float) $data['longitude']
                );
            }

            public function set($model, $key, $value, $attributes)
            {
                if ($value === null) {
                    return null;
                }

                if (is_array($value)) {
                    $value = Coordinates::fromArray($value);
                }

                if (! $value instanceof Coordinates) {
                    throw new \InvalidArgumentException('Value must be a Coordinates instance');
                }

                return json_encode($value->toArray());
            }
        };
    }
}
