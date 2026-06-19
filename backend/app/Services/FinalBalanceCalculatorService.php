<?php

namespace App\Services;

use App\Domains\Quote\Models\Quote;
use Illuminate\Support\Collection;

/**
 * Pure calculation and data-building service for Final Balance documents.
 * No database operations — only computations and array construction.
 */
class FinalBalanceCalculatorService
{
    /**
     * Calculate a single item's total after discount.
     */
    public function calculateItemTotal(float $qty, float $unitPrice, float $discountPct): float
    {
        $subtotal = $qty * $unitPrice;

        return $subtotal - ($subtotal * ($discountPct / 100));
    }

    /**
     * Calculate document-level totals from a subtotal, discount %, and tax %.
     *
     * @return array{subtotal: float, discount_amount: float, tax_amount: float, total_amount: float}
     */
    public function calculateDocumentTotals(float $subtotal, float $discountPct, float $taxPct): array
    {
        $discountAmount = $subtotal * ($discountPct / 100);
        $taxBase = $subtotal - $discountAmount;
        $taxAmount = $taxBase * ($taxPct / 100);

        return [
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'total_amount' => $taxBase + $taxAmount,
        ];
    }

    /**
     * Build a single quote_reference item from a Quote model.
     *
     * @return array<string, mixed>
     */
    public function buildQuoteReferenceItem(Quote $quote): array
    {
        return [
            'type' => 'quote_reference',
            'description' => "Riferimento preventivo {$quote->code}: {$quote->title}",
            'code' => $quote->code,
            'unit' => 'flat',
            'quantity' => 1,
            'unit_price' => (float) $quote->total_amount,
            'cost_price' => null,
            'discount_percentage' => 0,
            'subtotal' => (float) $quote->total_amount,
            'is_manual' => false,
            'notes' => null,
        ];
    }

    /**
     * Build item arrays from extra project materials (is_extra = true).
     *
     * @return array<int, array<string, mixed>>
     */
    public function buildItemsFromExtraMaterials(Collection $materials): array
    {
        $items = [];

        foreach ($materials as $material) {
            $unitPrice = (float) ($material->actual_unit_cost ?? $material->planned_unit_cost ?? 0);
            $quantity = (float) ($material->used_quantity ?? 0);

            $items[] = [
                'type' => 'material',
                'description' => $material->product?->name ?? 'Materiale extra',
                'code' => $material->product?->code,
                'unit' => $material->product?->unit ?? 'pz',
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'cost_price' => (float) ($material->planned_unit_cost ?? 0),
                'discount_percentage' => 0,
                'subtotal' => $quantity * $unitPrice,
                'is_manual' => false,
                'project_material_id' => $material->id,
                'notes' => $material->notes,
            ];
        }

        return $items;
    }

    /**
     * Build item arrays from project services (not from quote, completed).
     *
     * @return array<int, array<string, mixed>>
     */
    public function buildItemsFromServices(Collection $services): array
    {
        $items = [];

        foreach ($services as $service) {
            $unitPrice = (float) ($service->unit_price ?? 0);
            $quantity = (float) ($service->quantity ?? 1);

            $items[] = [
                'type' => 'service',
                'description' => $service->name ?? 'Servizio',
                'code' => $service->code,
                'unit' => $service->unit ?? 'flat',
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'cost_price' => (float) ($service->cost_price ?? 0),
                'discount_percentage' => 0,
                'subtotal' => $quantity * $unitPrice,
                'is_manual' => false,
                'project_service_id' => $service->id,
                'notes' => $service->notes,
            ];
        }

        return $items;
    }

    /**
     * Build item arrays from billable project expenses.
     *
     * @return array<int, array<string, mixed>>
     */
    public function buildItemsFromExpenses(Collection $expenses): array
    {
        $items = [];

        foreach ($expenses as $expense) {
            $amount = (float) ($expense->amount ?? 0);

            $items[] = [
                'type' => 'expense',
                'description' => $expense->description ?? 'Spesa',
                'code' => null,
                'unit' => 'flat',
                'quantity' => 1,
                'unit_price' => $amount,
                'cost_price' => $amount,
                'discount_percentage' => 0,
                'subtotal' => $amount,
                'is_manual' => false,
                'project_expense_id' => $expense->id,
                'notes' => $expense->notes,
            ];
        }

        return $items;
    }

    /**
     * Build item arrays from chargeable material incidents/damages.
     *
     * @return array<int, array<string, mixed>>
     */
    public function buildItemsFromIncidents(Collection $incidents): array
    {
        $items = [];

        foreach ($incidents as $incident) {
            $unitPrice = (float) ($incident->estimated_repair_cost ?? $incident->actual_repair_cost ?? 0);

            $items[] = [
                'type' => 'damage',
                'description' => $incident->description ?? 'Danno/Incidente',
                'code' => null,
                'unit' => 'flat',
                'quantity' => 1,
                'unit_price' => $unitPrice,
                'cost_price' => $unitPrice,
                'discount_percentage' => 0,
                'subtotal' => $unitPrice,
                'is_manual' => false,
                'incident_id' => $incident->id,
                'notes' => $incident->notes,
            ];
        }

        return $items;
    }

    /**
     * Build item arrays from billable overtime labor logs grouped by worker.
     *
     * @return array<int, array<string, mixed>>
     */
    public function buildItemsFromOvertimeLogs(Collection $logs): array
    {
        $items = [];

        // Group by worker
        $grouped = $logs->groupBy('worker_id');

        foreach ($grouped as $workerId => $workerLogs) {
            $firstLog = $workerLogs->first();
            $totalHours = $workerLogs->sum(function ($log) {
                return (float) ($log->overtime_hours ?? 0);
            });

            $hourlyRate = (float) ($firstLog->billable_hourly_rate ?? $firstLog->hourly_rate ?? 0);
            $workerName = $firstLog->worker?->full_name ?? "Operaio #{$workerId}";

            if ($totalHours <= 0) {
                continue;
            }

            $items[] = [
                'type' => 'labor',
                'description' => "Ore straordinarie: {$workerName}",
                'code' => null,
                'unit' => 'h',
                'quantity' => $totalHours,
                'unit_price' => $hourlyRate,
                'cost_price' => $hourlyRate,
                'discount_percentage' => 0,
                'subtotal' => $totalHours * $hourlyRate,
                'is_manual' => false,
                'notes' => null,
            ];
        }

        return $items;
    }
}
