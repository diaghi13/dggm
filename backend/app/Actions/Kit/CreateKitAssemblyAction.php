<?php

namespace App\Actions\Kit;

use App\Domains\Product\Enums\ProductType;
use App\Domains\Product\Models\Product;
use App\Enums\KitAssemblyStatus;
use App\Events\KitAssembled;
use App\Models\KitAssembly;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CreateKitAssemblyAction
{
    /**
     * @param  Product  $kitProduct  Il prodotto KIT da assemblare
     * @param  array  $items  [['product_id' => int, 'quantity' => float, 'serial_number' => ?string, 'notes' => ?string], ...]
     * @param  int|null  $warehouseId  Magazzino associato all'assembly
     * @param  array  $assemblyData  ['name' => string, 'location' => ?string, 'notes' => ?string]
     */
    public function execute(
        Product $kitProduct,
        array $items,
        ?int $warehouseId,
        array $assemblyData
    ): KitAssembly {
        if ($kitProduct->product_type !== ProductType::KIT) {
            throw new InvalidArgumentException('Il prodotto non è di tipo KIT.');
        }

        return DB::transaction(function () use ($kitProduct, $items, $warehouseId, $assemblyData) {
            $assembly = KitAssembly::create([
                ...$assemblyData,
                'product_id' => $kitProduct->id,
                'warehouse_id' => $warehouseId,
                'status' => KitAssemblyStatus::Assembled,
                'assembled_at' => now(),
                'assembled_by_user_id' => auth()->id(),
            ]);

            foreach ($items as $item) {
                $assembly->items()->create($item);
            }

            KitAssembled::dispatch($assembly, ['user_id' => auth()->id()]);

            return $assembly->load(['items.product', 'product']);
        });
    }
}
