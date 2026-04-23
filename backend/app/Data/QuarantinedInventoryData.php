<?php

namespace App\Data;

use App\Enums\RepairOrderStatus;
use Spatie\LaravelData\Data;

class QuarantinedInventoryData extends Data
{
    public function __construct(
        public readonly int $inventory_id,
        public readonly int $product_id,
        public readonly ?string $product_name,
        public readonly ?string $product_code,
        public readonly int $warehouse_id,
        public readonly float $quantity_quarantine,
        public readonly ?string $quarantine_reason,
        public readonly ?string $quarantine_since,
        public readonly ?int $days_in_quarantine,
        public readonly ?RepairOrderStatus $repair_order_status,
        public readonly ?int $repair_order_id,
    ) {}
}
