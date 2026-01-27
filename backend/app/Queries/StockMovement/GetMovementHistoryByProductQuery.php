<?php

namespace App\Queries\StockMovement;

use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Collection;

readonly class GetMovementHistoryByProductQuery
{
    public function __construct(
        private int $productId,
        private ?int $limit = null
    ) {}

    public function execute(): Collection
    {
        $query = StockMovement::where('product_id', $this->productId)
            ->with(['warehouse', 'user', 'ddt'])
            ->orderBy('movement_date', 'desc')
            ->orderBy('created_at', 'desc');

        if ($this->limit) {
            $query->limit($this->limit);
        }

        return $query->get();
    }
}
