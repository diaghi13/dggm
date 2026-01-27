<?php

namespace App\Queries\Product;

use App\Models\Product;

/**
 * CalculateProductRelationsQuery
 *
 * Query class to calculate all product relations for a given quantity
 * Returns the 3 lists: quote, material, stock
 */
readonly class CalculateProductRelationsQuery
{
    public function __construct(
        private Product $product
    ) {}

    public function execute(float $quantity): array
    {
        return $this->product->calculateAllRelations($quantity);
    }

    /**
     * Get only quote list (LISTA 1: Preventivo cliente)
     */
    public function getQuoteList(float $quantity): array
    {
        $result = $this->execute($quantity);

        return $result['quote'] ?? [];
    }

    /**
     * Get only material list (LISTA 2: Materiale cantiere)
     */
    public function getMaterialList(float $quantity): array
    {
        $result = $this->execute($quantity);

        return $result['material'] ?? [];
    }

    /**
     * Get only stock list (LISTA 3: Stock magazzino)
     */
    public function getStockList(float $quantity): array
    {
        $result = $this->execute($quantity);

        return $result['stock'] ?? [];
    }
}
