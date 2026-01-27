<?php

namespace App\Services;

use App\ValueObjects\Coordinates;

/**
 * GeolocationService
 *
 * Service per operazioni GPS e geolocalizzazione.
 * Contiene logica complessa per calcoli di distanze, validazioni GPS, etc.
 *
 * Usato in:
 * - TimeTracking (validazione timbrature entro raggio cantiere)
 * - Sites (calcolo distanza tra cantieri)
 * - Vehicles (tracking posizione mezzi)
 * - Workers (assegnazione cantiere più vicino)
 */
class GeolocationService
{
    /**
     * Calcola distanza tra due coordinate usando formula Haversine
     *
     * @return float Distanza in kilometri
     */
    public function calculateDistance(Coordinates $point1, Coordinates $point2): float
    {
        $earthRadiusKm = 6371;

        $latFrom = deg2rad($point1->latitude);
        $lonFrom = deg2rad($point1->longitude);
        $latTo = deg2rad($point2->latitude);
        $lonTo = deg2rad($point2->longitude);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $a = sin($latDelta / 2) ** 2 +
             cos($latFrom) * cos($latTo) *
             sin($lonDelta / 2) ** 2;

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadiusKm * $c;
    }

    /**
     * Calcola distanza in metri
     *
     * @return float Distanza in metri
     */
    public function calculateDistanceInMeters(Coordinates $point1, Coordinates $point2): float
    {
        return $this->calculateDistance($point1, $point2) * 1000;
    }

    /**
     * Verifica se un punto è entro un raggio dal centro
     *
     * @param  float  $radiusKm  Raggio in kilometri
     */
    public function isWithinRadius(Coordinates $point, Coordinates $center, float $radiusKm): bool
    {
        $distance = $this->calculateDistance($point, $center);

        return $distance <= $radiusKm;
    }

    /**
     * Verifica se un punto è entro un raggio in metri dal centro
     *
     * @param  float  $radiusMeters  Raggio in metri
     */
    public function isWithinRadiusMeters(Coordinates $point, Coordinates $center, float $radiusMeters): bool
    {
        return $this->isWithinRadius($point, $center, $radiusMeters / 1000);
    }

    /**
     * Trova il punto più vicino da una lista di coordinate
     *
     * @param  array<Coordinates>  $points
     * @return array{coordinates: Coordinates, distance: float}|null
     */
    public function findClosest(Coordinates $from, array $points): ?array
    {
        if (empty($points)) {
            return null;
        }

        $closest = null;
        $minDistance = PHP_FLOAT_MAX;

        foreach ($points as $point) {
            $distance = $this->calculateDistance($from, $point);

            if ($distance < $minDistance) {
                $minDistance = $distance;
                $closest = $point;
            }
        }

        return [
            'coordinates' => $closest,
            'distance' => $minDistance,
        ];
    }

    /**
     * Filtra punti entro un certo raggio
     *
     * @param  array<Coordinates>  $points
     * @return array<array{coordinates: Coordinates, distance: float}>
     */
    public function filterWithinRadius(Coordinates $center, array $points, float $radiusKm): array
    {
        $filtered = [];

        foreach ($points as $point) {
            $distance = $this->calculateDistance($center, $point);

            if ($distance <= $radiusKm) {
                $filtered[] = [
                    'coordinates' => $point,
                    'distance' => $distance,
                ];
            }
        }

        // Ordina per distanza crescente
        usort($filtered, fn ($a, $b) => $a['distance'] <=> $b['distance']);

        return $filtered;
    }

    /**
     * Calcola il punto centrale (centroid) di un gruppo di coordinate
     */
    public function calculateCentroid(array $points): Coordinates
    {
        if (empty($points)) {
            throw new \InvalidArgumentException('Cannot calculate centroid of empty array');
        }

        $totalLat = 0;
        $totalLon = 0;
        $count = count($points);

        foreach ($points as $point) {
            $totalLat += $point->latitude;
            $totalLon += $point->longitude;
        }

        return new Coordinates(
            latitude: $totalLat / $count,
            longitude: $totalLon / $count
        );
    }

    /**
     * Genera URL per direzioni Google Maps tra due punti
     */
    public function getDirectionsUrl(Coordinates $from, Coordinates $to): string
    {
        return sprintf(
            'https://www.google.com/maps/dir/?api=1&origin=%s,%s&destination=%s,%s',
            $from->latitude,
            $from->longitude,
            $to->latitude,
            $to->longitude
        );
    }
}
