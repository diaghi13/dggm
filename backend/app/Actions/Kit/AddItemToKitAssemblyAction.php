<?php

namespace App\Actions\Kit;

use App\Enums\KitAssemblyStatus;
use App\Models\KitAssembly;
use App\Models\KitAssemblyItem;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class AddItemToKitAssemblyAction
{
    /**
     * Aggiunge un componente a un'assembly esistente.
     *
     * @param  array  $item  ['product_id' => int, 'quantity' => float, 'serial_number' => ?string, 'notes' => ?string]
     */
    public function execute(KitAssembly $assembly, array $item, ?int $warehouseId): KitAssemblyItem
    {
        if ($assembly->status === KitAssemblyStatus::Disassembled) {
            throw new InvalidArgumentException('Impossibile aggiungere componenti a un\'assembly smontata.');
        }

        return DB::transaction(function () use ($assembly, $item) {
            $kitItem = $assembly->items()->create($item);

            return $kitItem->load('product');
        });
    }
}
