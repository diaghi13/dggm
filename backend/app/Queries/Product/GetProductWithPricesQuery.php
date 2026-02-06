<?php

namespace App\Queries\Product;

use App\Models\Product;

/**
 * Get Product With Prices Query
 *
 * Retrieves a product with all pricing information:
 * - Manufacturer prices
 * - Supplier prices
 * - Price list items
 */
class GetProductWithPricesQuery
{
    public function __construct(
        private readonly int $productId,
        private readonly ?int $priceListId = null
    ) {}

    /**
     * Execute the query
     */
    public function execute(): ?Product
    {
        $product = Product::with([
            'brand',
            'category',
            'suppliers' => fn ($q) => $q->wherePivot('is_active', true)
                ->orderByDesc('supplier_product.is_preferred_supplier')
                ->orderByDesc('supplier_product.purchase_price'),
        ])->find($this->productId);

        if (! $product) {
            return null;
        }

        // Attach price list items if specified
        if ($this->priceListId) {
            $product->load([
                'priceListItems' => fn ($q) => $q->where('price_list_id', $this->priceListId)
                    ->where('is_active', true)
                    ->with('priceList'),
            ]);
        } else {
            // Load all active price list items
            $product->load([
                'activePriceListItems' => fn ($q) => $q->with('priceList'),
            ]);
        }

        return $product;
    }
}
