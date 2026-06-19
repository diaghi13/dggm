<?php

namespace App\Actions\FinalBalance;

use App\Data\GenerateFinalBalanceData;
use App\Domains\Project\Models\Project;
use App\Domains\Quote\Models\Quote;
use App\Events\FinalBalanceGenerated;
use App\Models\FinalBalance;
use App\Models\FinalBalanceItem;
use App\Services\CodeGeneratorService;
use App\Services\FinalBalanceCalculatorService;
use Illuminate\Support\Facades\DB;

class GenerateFinalBalanceAction
{
    public function __construct(
        private readonly FinalBalanceCalculatorService $calculator
    ) {}

    public function execute(GenerateFinalBalanceData $data, ?Project $project = null): FinalBalance
    {
        return DB::transaction(function () use ($data, $project) {
            $code = app(CodeGeneratorService::class)->generate('final_balance');

            $finalBalance = FinalBalance::create([
                'project_id' => $project?->id ?? $data->project_id,
                'quote_id' => $data->quote_id,
                'customer_id' => $data->customer_id ?? $project?->customer_id,
                'reference_text' => $data->reference_text,
                'code' => $code,
                'title' => $data->title ?? ('Final Balance '.now()->format('Y')),
                'is_partial' => $data->is_partial ?? false,
                'notes' => $data->notes,
                'tax_percentage' => $data->tax_percentage ?? 22.0,
                'discount_percentage' => $data->discount_percentage ?? 0,
                'created_by_user_id' => auth()->id(),
            ]);

            $sortOrder = 0;

            // If linked to quote: ONE quote_reference item
            if ($data->quote_id && ($data->include_quote_reference ?? true)) {
                $quote = Quote::find($data->quote_id);
                if ($quote) {
                    $item = $this->calculator->buildQuoteReferenceItem($quote);
                    $item['total'] = $this->calculator->calculateItemTotal(
                        (float) $item['quantity'],
                        (float) $item['unit_price'],
                        (float) ($item['discount_percentage'] ?? 0)
                    );
                    FinalBalanceItem::create([...$item, 'final_balance_id' => $finalBalance->id, 'sort_order' => $sortOrder++]);
                }
            }

            // Extra materials (is_extra = true AND include_in_final_balance = true)
            if (($data->include_extra_materials ?? true) && $project) {
                $materials = $project->materials()
                    ->where('is_extra', true)
                    ->where('include_in_final_balance', true)
                    ->with('product')
                    ->get();
                foreach ($this->calculator->buildItemsFromExtraMaterials($materials) as $item) {
                    $item['total'] = $this->calculator->calculateItemTotal(
                        (float) $item['quantity'],
                        (float) $item['unit_price'],
                        0
                    );
                    FinalBalanceItem::create([...$item, 'final_balance_id' => $finalBalance->id, 'sort_order' => $sortOrder++]);
                }
            }

            // Services not from quote (completed)
            if (($data->include_services ?? true) && $project) {
                $services = $project->services()
                    ->where('is_from_quote', false)
                    ->where('status', 'completed')
                    ->get();
                foreach ($this->calculator->buildItemsFromServices($services) as $item) {
                    $item['total'] = $this->calculator->calculateItemTotal(
                        (float) $item['quantity'],
                        (float) $item['unit_price'],
                        0
                    );
                    FinalBalanceItem::create([...$item, 'final_balance_id' => $finalBalance->id, 'sort_order' => $sortOrder++]);
                }
            }

            // Billable expenses (approved)
            if (($data->include_expenses ?? true) && $project) {
                $expenses = $project->expenses()
                    ->where('billable_to_final_balance', true)
                    ->where('status', 'approved')
                    ->get();
                foreach ($this->calculator->buildItemsFromExpenses($expenses) as $item) {
                    $item['total'] = $this->calculator->calculateItemTotal(
                        (float) $item['quantity'],
                        (float) $item['unit_price'],
                        0
                    );
                    FinalBalanceItem::create([...$item, 'final_balance_id' => $finalBalance->id, 'sort_order' => $sortOrder++]);
                }
            }

            // Chargeable incidents/damages
            if (($data->include_damages ?? true) && $project) {
                $incidents = $project->incidents()
                    ->where('is_chargeable_to_client', true)
                    ->whereNotIn('status', ['open'])
                    ->get();
                foreach ($this->calculator->buildItemsFromIncidents($incidents) as $item) {
                    $item['total'] = $this->calculator->calculateItemTotal(
                        (float) $item['quantity'],
                        (float) $item['unit_price'],
                        0
                    );
                    FinalBalanceItem::create([...$item, 'final_balance_id' => $finalBalance->id, 'sort_order' => $sortOrder++]);
                }
            }

            // Billable overtime logs
            if (($data->include_overtime ?? true) && $project) {
                $logs = $project->laborLogs()
                    ->where('is_billable_to_client', true)
                    ->where('include_in_final_balance', true)
                    ->with('worker')
                    ->get();
                foreach ($this->calculator->buildItemsFromOvertimeLogs($logs) as $item) {
                    $item['total'] = $this->calculator->calculateItemTotal(
                        (float) $item['quantity'],
                        (float) $item['unit_price'],
                        0
                    );
                    FinalBalanceItem::create([...$item, 'final_balance_id' => $finalBalance->id, 'sort_order' => $sortOrder++]);
                }
            }

            $finalBalance->recalculate();

            FinalBalanceGenerated::dispatch($finalBalance);

            return $finalBalance->load('items', 'project', 'quote', 'customer');
        });
    }
}
