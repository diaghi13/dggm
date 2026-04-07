<?php

namespace App\Services;

use Illuminate\Support\Carbon;

/**
 * ProrationCalculatorService
 *
 * Calcola il prezzo prorato di un addon aggiunto a metà ciclo di fatturazione.
 *
 * Formula: prezzo_prorato = prezzo_addon × (giorni_rimanenti / giorni_totali_ciclo)
 *
 * Regola: se giorni_rimanenti <= 1, ritorna il prezzo pieno (prorata non applicabile).
 */
class ProrationCalculatorService
{
    /**
     * Calcola i giorni rimanenti nel ciclo corrente dalla data odierna fino a renews_at.
     */
    public function calculateDaysRemaining(Carbon $renewsAt): int
    {
        $today = Carbon::today();

        if ($renewsAt->lte($today)) {
            return 0;
        }

        return (int) $today->diffInDays($renewsAt);
    }

    /**
     * Calcola i giorni totali del ciclo basandosi sul billing_cycle.
     *
     * monthly = 30, yearly = 365
     */
    public function calculateCycleDays(string $billingCycle): int
    {
        return match ($billingCycle) {
            'yearly' => 365,
            default => 30,
        };
    }

    /**
     * Calcola il prezzo prorato di un addon.
     *
     * @return array{prorated_amount: float, cycle_days_total: int, cycle_days_remaining: int, full_price: float, savings: float}
     */
    public function calculateAddonProration(
        float $addonPrice,
        string $billingCycle,
        Carbon $renewsAt
    ): array {
        $cycleDays = $this->calculateCycleDays($billingCycle);
        $daysRemaining = $this->calculateDaysRemaining($renewsAt);

        // Se rimane 1 giorno o meno, non ha senso prorata: addebita il pieno
        if ($daysRemaining <= 1) {
            return [
                'prorated_amount' => round($addonPrice, 2),
                'cycle_days_total' => $cycleDays,
                'cycle_days_remaining' => $daysRemaining,
                'full_price' => round($addonPrice, 2),
                'savings' => 0.0,
            ];
        }

        $proratedAmount = $addonPrice * ($daysRemaining / $cycleDays);
        $proratedAmount = round($proratedAmount, 2);
        $savings = round($addonPrice - $proratedAmount, 2);

        return [
            'prorated_amount' => $proratedAmount,
            'cycle_days_total' => $cycleDays,
            'cycle_days_remaining' => $daysRemaining,
            'full_price' => round($addonPrice, 2),
            'savings' => $savings,
        ];
    }

    /**
     * Calcola la prorazione per multipli addon.
     *
     * @param  array<int, array{feature_key: string, price: float}>  $addons
     * @return array{breakdown: array<int, array{feature_key: string, prorated_amount: float, full_price: float, savings: float}>, total_prorated: float, total_full: float, total_savings: float, cycle_days_total: int, cycle_days_remaining: int}
     */
    public function calculateMultipleAddonsProration(
        array $addons,
        string $billingCycle,
        Carbon $renewsAt
    ): array {
        $cycleDays = $this->calculateCycleDays($billingCycle);
        $daysRemaining = $this->calculateDaysRemaining($renewsAt);

        $breakdown = [];
        $totalProrated = 0.0;
        $totalFull = 0.0;

        foreach ($addons as $addon) {
            $result = $this->calculateAddonProration(
                $addon['price'],
                $billingCycle,
                $renewsAt
            );

            $breakdown[] = [
                'feature_key' => $addon['feature_key'],
                'prorated_amount' => $result['prorated_amount'],
                'full_price' => $result['full_price'],
                'savings' => $result['savings'],
            ];

            $totalProrated += $result['prorated_amount'];
            $totalFull += $result['full_price'];
        }

        $totalProrated = round($totalProrated, 2);
        $totalFull = round($totalFull, 2);
        $totalSavings = round($totalFull - $totalProrated, 2);

        return [
            'breakdown' => $breakdown,
            'total_prorated' => $totalProrated,
            'total_full' => $totalFull,
            'total_savings' => $totalSavings,
            'cycle_days_total' => $cycleDays,
            'cycle_days_remaining' => $daysRemaining,
        ];
    }
}
