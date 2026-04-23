<?php

namespace App\Queries\FinalBalance;

use App\Models\FinalBalance;

class GetFinalBalanceWithItemsQuery
{
    public function __construct(
        private readonly FinalBalance $finalBalance
    ) {}

    public function execute(): FinalBalance
    {
        return $this->finalBalance->load([
            'rootItems' => function ($query) {
                $query->orderBy('sort_order')
                    ->with([
                        'children' => function ($q) {
                            $q->orderBy('sort_order');
                        },
                        'quoteItem',
                        'projectMaterial.product',
                        'projectService',
                        'projectExpense',
                        'incident',
                    ]);
            },
            'project',
            'quote',
            'customer',
            'createdBy',
            'finalizedBy',
            'approvedBy',
        ]);
    }
}
