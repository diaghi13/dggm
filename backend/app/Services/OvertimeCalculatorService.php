<?php

namespace App\Services;

use App\Enums\OvertimeCause;

class OvertimeCalculatorService
{
    /**
     * Determine if the overtime should be billed to the client based on the cause.
     */
    public function shouldBeBillable(OvertimeCause $cause): bool
    {
        return in_array($cause, [
            OvertimeCause::ClientRequest,
            OvertimeCause::ProjectDelayClientFault,
        ]);
    }

    /**
     * Return the default rate multiplier for a given overtime cause.
     */
    public function getDefaultMultiplier(OvertimeCause $cause): float
    {
        return match ($cause) {
            OvertimeCause::ClientRequest => 1.50,
            OvertimeCause::ProjectDelayClientFault => 1.25,
            OvertimeCause::Unforeseen => 1.25,
            OvertimeCause::ProjectDelayOurFault => 1.00,
            OvertimeCause::Weather => 1.00,
        };
    }

    /**
     * Calculate the total overtime cost for given hours, multiplier and base rate.
     */
    public function calculateOvertimeCost(float $hours, float $multiplier, float $baseRate): float
    {
        return round($hours * $multiplier * $baseRate, 2);
    }
}
