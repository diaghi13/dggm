<?php

namespace App\Services;

use App\Models\ProductCategory;
use App\Models\RentalProfile;
use App\Models\Setting;

/**
 * RentalEngineService
 *
 * Calcola il moltiplicatore di durata per i noleggi usando la formula
 * a curva potenza con decadimento logaritmico (Power-Decay Curve):
 *
 *   Multiplier = (d^exponent_curve × decay_factor(d)) + duration_offset
 *   decay_factor(d) = 1 - (ln(d) / ln(max_duration_reference)) × decay_strength
 *
 * Proprietà garantite:
 *   - d=1 → Multiplier = 1.0 (caso speciale esatto)
 *   - Monotonicità: Mult(d1) < Mult(d2) per d1 < d2 (nessun cliff)
 *   - Floor stagionale: per d > max_period_cap_days → max(Mult(cap), formula(d))
 *
 * Parametri di default calibrati:
 *   7gg≈3.39× (range 3.2–4.0), 30gg≈7.78× (range 7.0–8.5), 90gg≈14.49× (range 13–16)
 */
class RentalEngineService
{
    public function calculateDurationMultiplier(float $duration, ?RentalProfile $profile = null): float
    {
        if ($duration <= 0) {
            return 0.0;
        }

        if ($duration == 1.0) {
            return 1.0;
        }

        $exponent = $profile ? (float) $profile->exponent_curve : (float) Setting::get('rental.exponent_curve', 0.69);
        $decayStrength = $profile ? (float) $profile->decay_strength : (float) Setting::get('rental.decay_strength', 0.27);
        $maxRef = $profile ? (float) $profile->max_duration_reference : (float) Setting::get('rental.max_duration_reference', 30);
        $durationOffset = $profile ? (float) $profile->duration_offset : (float) Setting::get('rental.duration_offset', 0.15);
        $capDays = $profile ? (float) $profile->max_period_cap_days : (float) Setting::get('rental.max_period_cap_days', 90);

        $capMultiplier = $this->calculateRaw($capDays, $exponent, $decayStrength, $maxRef, $durationOffset);
        $raw = $this->calculateRaw($duration, $exponent, $decayStrength, $maxRef, $durationOffset);

        if ($duration > $capDays) {
            return max($capMultiplier, $raw);
        }

        return $raw;
    }

    /**
     * Calcola i prezzi noleggio da costo d'acquisto usando la formula GYMME.
     *
     * Il tasso giornaliero base è derivato da calculateEstimatedBaseDay(purchaseCost)
     * che implementa la formula break-even con decadimento logaritmico.
     *
     * @param  float|null  $baseDaily  Optional override for the daily rate (e.g. from estimated_base_day).
     *                                 If provided and > 0, skips calculateEstimatedBaseDay().
     * @param  bool  $isPremium  Whether to apply premium multiplier to the base daily rate.
     * @return array{hourly: float, half_day: float, daily: float, weekly: float, monthly: float, seasonal: float}
     */
    public function calculateRentalPrices(float $purchaseCost, ?RentalProfile $profile = null, ?float $baseDaily = null, bool $isPremium = false): array
    {
        $daily = ($baseDaily !== null && $baseDaily > 0)
            ? $baseDaily
            : $this->calculateEstimatedBaseDay($purchaseCost, $isPremium);

        $commercialIndex = (float) Setting::get('rental.commercial_index', 1.0);
        $daily = $daily * $commercialIndex;

        $hoursPerDay = (float) Setting::get('rental.hours_per_day', 8);

        return [
            'hourly' => round($daily / $hoursPerDay, 2),
            'half_day' => round($daily * 0.7, 2),
            'daily' => round($daily, 2),
            'weekly' => round($daily * $this->calculateDurationMultiplier(7, $profile), 2),
            'monthly' => round($daily * $this->calculateDurationMultiplier(30, $profile), 2),
            'seasonal' => round($daily * $this->calculateDurationMultiplier(90, $profile), 2),
        ];
    }

    /**
     * Resolve rental profile parameters for a given product category.
     *
     * Priority:
     *   1. Category's active rental profile (if provided and profile is_active)
     *   2. Global rental.* settings fallback
     *
     * @return array{exponent_curve: float, decay_strength: float, max_duration_reference: float, duration_offset: float, max_period_cap_days: float, break_even_days: int, margin_percentage: float, scarcity_enabled: bool, scarcity_threshold: float, scarcity_multiplier: float, premium_multiplier: float}
     */
    public function resolveProfile(?ProductCategory $category = null): array
    {
        $profile = $category?->rentalProfile;

        if ($profile !== null && $profile->is_active) {
            return [
                'exponent_curve' => (float) $profile->exponent_curve,
                'decay_strength' => (float) $profile->decay_strength,
                'max_duration_reference' => (float) $profile->max_duration_reference,
                'duration_offset' => (float) $profile->duration_offset,
                'max_period_cap_days' => (float) $profile->max_period_cap_days,
                'break_even_days' => (int) Setting::get('rental.break_even_days', 30),
                'margin_percentage' => (float) Setting::get('rental.margin_percentage', 20),
                'scarcity_enabled' => (bool) Setting::get('rental.scarcity_enabled', false),
                'scarcity_threshold' => (float) Setting::get('rental.scarcity_threshold', 0.2),
                'scarcity_multiplier' => (float) Setting::get('rental.scarcity_multiplier', 1.15),
                'premium_multiplier' => (float) Setting::get('rental.premium_multiplier', 1.0),
            ];
        }

        return [
            'exponent_curve' => (float) Setting::get('rental.exponent_curve', 0.69),
            'decay_strength' => (float) Setting::get('rental.decay_strength', 0.27),
            'max_duration_reference' => (float) Setting::get('rental.max_duration_reference', 30),
            'duration_offset' => (float) Setting::get('rental.duration_offset', 0.15),
            'max_period_cap_days' => (float) Setting::get('rental.max_period_cap_days', 90),
            'break_even_days' => (int) Setting::get('rental.break_even_days', 30),
            'margin_percentage' => (float) Setting::get('rental.margin_percentage', 20),
            'scarcity_enabled' => (bool) Setting::get('rental.scarcity_enabled', false),
            'scarcity_threshold' => (float) Setting::get('rental.scarcity_threshold', 0.2),
            'scarcity_multiplier' => (float) Setting::get('rental.scarcity_multiplier', 1.15),
            'premium_multiplier' => (float) Setting::get('rental.premium_multiplier', 1.0),
        ];
    }

    /**
     * Calculate the estimated base daily rental rate for a product.
     *
     * Formula: costBasis / break_even_days × (1 + margin%) × [premium_multiplier if is_premium]
     *
     * This gives a cost-based floor for the daily rental price derived from the
     * purchase cost, not from the deprecated sale_price / daily_rate_percent shortcut.
     */
    public function calculateEstimatedBaseDay(float $costBasis, bool $isPremium = false): float
    {
        if ($costBasis <= 0) {
            return 0.0;
        }

        $breakEvenDays = (float) Setting::get('rental.break_even_days', 40);
        $marginPercentage = (float) Setting::get('rental.margin_percentage', 20);
        $premiumMultiplier = $isPremium
            ? (float) Setting::get('rental.premium_multiplier', 1.15)
            : 1.0;

        if ($breakEvenDays <= 0) {
            return 0.0;
        }

        return round(
            ($costBasis / $breakEvenDays) * (1 + $marginPercentage / 100) * $premiumMultiplier,
            2
        );
    }

    private function calculateRaw(
        float $duration,
        float $exponent,
        float $decayStrength,
        float $maxRef,
        float $offset
    ): float {
        $decayFactor = 1.0 - (log($duration) / log($maxRef)) * $decayStrength;

        return pow($duration, $exponent) * $decayFactor + $offset;
    }
}
