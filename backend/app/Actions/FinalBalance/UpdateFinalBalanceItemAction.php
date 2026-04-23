<?php

namespace App\Actions\FinalBalance;

use App\Data\UpdateFinalBalanceItemData;
use App\Models\FinalBalanceItem;
use App\Services\FinalBalanceCalculatorService;
use Illuminate\Support\Facades\DB;

class UpdateFinalBalanceItemAction
{
    public function __construct(
        private readonly FinalBalanceCalculatorService $calculator
    ) {}

    public function execute(FinalBalanceItem $item, UpdateFinalBalanceItemData $data): FinalBalanceItem
    {
        return DB::transaction(function () use ($item, $data) {
            $updates = array_filter($data->toArray(), fn ($value) => $value !== null);

            if (! empty($updates)) {
                $item->update($updates);
            }

            // Recalculate totals using current (possibly updated) values
            $subtotal = (float) $item->quantity * (float) $item->unit_price;
            $total = $this->calculator->calculateItemTotal(
                (float) $item->quantity,
                (float) $item->unit_price,
                (float) ($item->discount_percentage ?? 0)
            );

            $item->update([
                'subtotal' => $subtotal,
                'total' => $total,
            ]);

            $item->finalBalance->recalculate();

            return $item->fresh();
        });
    }
}
