<?php

namespace App\Domains\Warehouse\Queries\StockMovement;

use App\Domains\Warehouse\Models\StockMovement;
use App\Enums\StockMovementType;
use Illuminate\Database\Eloquent\Collection;

readonly class GetRentalHistoryQuery
{
    public function __construct(
        private ?int $productId = null,
        private ?int $projectId = null,
        private bool $activeOnly = false
    ) {}

    public function execute(): Collection
    {
        $query = StockMovement::query()
            ->whereIn('type', [
                StockMovementType::RENTAL_OUT,
                StockMovementType::RENTAL_RETURN,
            ])
            ->with(['product', 'project', 'ddt']);

        if ($this->productId) {
            $query->where('product_id', $this->productId);
        }

        if ($this->projectId) {
            $query->where('project_id', $this->projectId);
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
