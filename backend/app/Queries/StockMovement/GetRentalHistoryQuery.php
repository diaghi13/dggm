<?php

namespace App\Queries\StockMovement;

use App\Enums\StockMovementType;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Collection;

readonly class GetRentalHistoryQuery
{
    public function __construct(
        private ?int $productId = null,
        private ?int $siteId = null,
        private bool $activeOnly = false
    ) {}

    public function execute(): Collection
    {
        $query = StockMovement::query()
            ->whereIn('type', [
                StockMovementType::RENTAL_OUT,
                StockMovementType::RENTAL_RETURN,
            ])
            ->with(['product', 'site', 'ddt']);

        if ($this->productId) {
            $query->where('product_id', $this->productId);
        }

        if ($this->siteId) {
            $query->where('site_id', $this->siteId);
        }

        if ($this->activeOnly) {
            // Get only rentals that haven't been returned
            $query->where('type', StockMovementType::RENTAL_OUT)
                ->whereDoesntHave('ddt', function ($q) {
                    $q->whereHas('stockMovements', function ($sq) {
                        $sq->where('type', StockMovementType::RENTAL_RETURN);
                    });
                });
        }

        return $query->orderBy('movement_date', 'desc')->get();
    }
}
