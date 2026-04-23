<?php

namespace App\Services;

use App\Enums\DamageSeverity;
use App\Enums\IncidentType;
use App\Models\Project;

/**
 * IncidentBillingRuleService
 *
 * Pure service (no database writes). Encapsulates billing rules for material incidents:
 * determines chargeability and calculates suggested charge amounts.
 */
class IncidentBillingRuleService
{
    /**
     * Determine if an incident should be charged to the client based on context.
     *
     * Context values:
     * - 'rental_out'    → client is responsible for all rental items
     * - 'service_event' → client responsible only for loss/theft
     * - 'sale'          → use supplier warranty/replacement, never charge
     */
    public function isChargeable(IncidentType $type, string $context): bool
    {
        return match ($context) {
            'rental_out' => true,
            'service_event' => in_array($type, [IncidentType::LostByClient, IncidentType::Stolen]),
            'sale' => false,
            default => false,
        };
    }

    /**
     * Calculate the suggested charge amount based on material cost and damage severity.
     *
     * - write_off: full replacement cost (unitCost × quantity)
     * - major:     75% of full cost
     * - minor:     25% of full cost
     * - null:      full cost (assume full replacement)
     */
    public function calculateChargeAmount(
        float $unitCost,
        float $quantity,
        ?DamageSeverity $severity
    ): float {
        $fullCost = $unitCost * $quantity;

        return match ($severity) {
            DamageSeverity::WriteOff => $fullCost,
            DamageSeverity::Major => $fullCost * 0.75,
            DamageSeverity::Minor => $fullCost * 0.25,
            default => $fullCost,
        };
    }

    /**
     * Resolve the billing context for a project.
     *
     * Checks the project's quote type or project metadata to determine context.
     * Returns 'service_event' by default — refined when project type field is added.
     */
    public function resolveProjectContext(Project $project): string
    {
        // If the project is linked to a rental quote, use rental context
        if ($project->quote_id && $project->relationLoaded('quote') && $project->quote) {
            $quoteType = $project->quote->type ?? null;
            if ($quoteType && str_contains(strtolower((string) $quoteType), 'rental')) {
                return 'rental_out';
            }
        }

        // Default: service/event context
        return 'service_event';
    }
}
