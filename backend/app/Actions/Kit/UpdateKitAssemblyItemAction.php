<?php

namespace App\Actions\Kit;

use App\Models\KitAssembly;
use App\Models\KitAssemblyItem;
use Illuminate\Support\Facades\DB;

class UpdateKitAssemblyItemAction
{
    public function execute(KitAssembly $assembly, KitAssemblyItem $item, array $data): KitAssemblyItem
    {
        return DB::transaction(function () use ($item, $data) {
            $item->update(array_filter([
                'quantity' => $data['quantity'] ?? null,
                'serial_number' => array_key_exists('serial_number', $data) ? $data['serial_number'] : $item->serial_number,
                'notes' => array_key_exists('notes', $data) ? $data['notes'] : $item->notes,
            ], fn ($v) => $v !== null));

            return $item->fresh()->load('product');
        });
    }
}
