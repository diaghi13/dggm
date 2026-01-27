<?php

namespace App\Queries\Ddt;

use App\Models\Ddt;

readonly class GetDdtByIdQuery
{
    public function __construct(
        private int $id
    ) {}

    public function execute(): Ddt
    {
        return Ddt::with([
            'supplier',
            'customer',
            'site',
            'fromWarehouse',
            'toWarehouse',
            'items.product.category',
            'createdBy',
            'stockMovements.product',
            'parentDdt',
        ])->findOrFail($this->id);
    }
}
