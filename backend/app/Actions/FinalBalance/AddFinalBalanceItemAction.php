<?php

namespace App\Actions\FinalBalance;

use App\Data\CreateFinalBalanceItemData;
use App\Models\FinalBalance;
use App\Models\FinalBalanceItem;
use App\Services\FinalBalanceCalculatorService;
use Illuminate\Support\Facades\DB;

class AddFinalBalanceItemAction
{
    public function __construct(
        private readonly FinalBalanceCalculatorService $calculator
    ) {}

    public function execute(FinalBalance $finalBalance, CreateFinalBalanceItemData $data): FinalBalanceItem
    {
        return DB::transaction(function () use ($finalBalance, $data) {
            $total = $this->calculator->calculateItemTotal(
                (float) $data->quantity,
                (float) $data->unit_price,
                (float) ($data->discount_percentage ?? 0)
            );

            $subtotal = (float) $data->quantity * (float) $data->unit_price;

            $item = FinalBalanceItem::create([
                'final_balance_id' => $finalBalance->id,
                'parent_id' => $data->parent_id,
                'type' => $data->type,
                'description' => $data->description,
                'unit' => $data->unit,
                'quantity' => $data->quantity,
                'unit_price' => $data->unit_price,
                'cost_price' => $data->cost_price,
                'discount_percentage' => $data->discount_percentage ?? 0,
                'subtotal' => $subtotal,
                'total' => $total,
                'sort_order' => $data->sort_order ?? 0,
                'notes' => $data->notes,
                'is_manual' => true,
            ]);

            $finalBalance->recalculate();

            return $item;
        });
    }
}
