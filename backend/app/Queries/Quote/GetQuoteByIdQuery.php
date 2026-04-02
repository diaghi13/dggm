<?php

namespace App\Queries\Quote;

use App\Models\Quote;

class GetQuoteByIdQuery
{
    /**
     * Execute the query to get a quote by ID with all relationships
     */
    public static function execute(int $quoteId): ?Quote
    {
        return Quote::with([
            'customer',
            'projectManager',
            'priceList',
            'paymentTerm',
            'financialResource',
            'warrantyType',
            'project',
            'template',
            'deposits',
            'items' => function ($query) {
                $query->with(['product', 'priceListItem', 'children'])
                    ->orderBy('sort_order');
            },
        ])->find($quoteId);
    }
}
