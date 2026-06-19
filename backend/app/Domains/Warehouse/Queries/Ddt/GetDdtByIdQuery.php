<?php

namespace App\Domains\Warehouse\Queries\Ddt;

use App\Domains\Warehouse\Models\Ddt;

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
            'project',
            'priceList',
            'fromWarehouse',
            'toWarehouse',
            'items.product.category',
            'items.kitAssembly',
            'createdBy',
            'stockMovements.product',
            'parentDdt',
        ])->findOrFail($this->id);
    }
}
