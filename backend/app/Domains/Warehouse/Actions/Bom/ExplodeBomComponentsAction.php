<?php

namespace App\Domains\Warehouse\Actions\Bom;

use App\Domains\Product\Enums\ProductType;
use App\Domains\Product\Models\Product;
use App\Domains\Warehouse\Models\Ddt;
use App\Domains\Warehouse\Models\Inventory;
use App\Domains\Warehouse\Models\StockMovement;
use App\Enums\StockMovementType;
use App\Events\StockMovementCreated;
use Illuminate\Support\Facades\Log;

class ExplodeBomComponentsAction
{
    public function execute(
        int $productId,
        int $warehouseId,
        float $quantity,
        string $direction, // 'in' | 'out'
        Ddt $ddt,
        int $depth = 0,
    ): void {
        if ($depth > 10) {
            Log::warning('BOM expansion: max recursion depth reached', ['product_id' => $productId]);

            return;
        }

        $product = Product::with(['relations' => function ($q) {
            $q->components()
                ->requiredForStock()
                ->with(['relatedProduct', 'relationType']);
        }])->find($productId);

        if (! $product || $product->relations->isEmpty()) {
            return;
        }

        if (! in_array($product->product_type, [ProductType::KIT, ProductType::COMPOSITE])) {
            return;
        }

        $movementType = $direction === 'out'
            ? StockMovementType::KIT_ASSEMBLY
            : StockMovementType::KIT_DISASSEMBLY;

        foreach ($product->relations as $relation) {
            $component = $relation->relatedProduct;
            if (! $component) {
                continue;
            }

            $componentQty = $relation->calculateQuantity($quantity);
            if ($componentQty <= 0) {
                continue;
            }

            $movement = StockMovement::create([
                'ddt_id' => $ddt->id,
                'product_id' => $component->id,
                'warehouse_id' => $warehouseId,
                'type' => $movementType,
                'quantity' => $componentQty,
                'unit_cost' => $component->standard_cost,
                'movement_date' => $ddt->ddt_date,
                'project_id' => $ddt->project_id,
                'user_id' => $ddt->created_by,
                'notes' => "BOM expansion da {$product->name} (DDT {$ddt->code})",
                'reference_document' => $ddt->code,
            ]);

            $inventory = Inventory::firstOrCreate(
                ['product_id' => $component->id, 'warehouse_id' => $warehouseId],
                ['quantity_available' => 0, 'quantity_reserved' => 0, 'quantity_in_transit' => 0, 'quantity_quarantine' => 0, 'quantity_out_on_rental' => 0],
            );

            if ($direction === 'out') {
                $inventory->decrement('quantity_available', $componentQty);
            } else {
                $inventory->increment('quantity_available', $componentQty);
            }

            StockMovementCreated::dispatch($movement);

            Log::info('BOM component stock updated', [
                'ddt_id' => $ddt->id,
                'parent_product_id' => $productId,
                'component_id' => $component->id,
                'qty' => $componentQty,
                'direction' => $direction,
            ]);

            // Recurse only for COMPOSITE components — KIT is an independent unit with its own stock lifecycle
            if ($component->product_type === ProductType::COMPOSITE) {
                $this->execute($component->id, $warehouseId, $componentQty, $direction, $ddt, $depth + 1);
            }
        }
    }
}
