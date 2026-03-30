<?php

namespace App\Actions\Kit;

use App\Enums\KitAssemblyStatus;
use App\Models\KitAssembly;
use App\Models\KitAssemblyItem;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RemoveItemFromKitAssemblyAction
{
    /**
     * Rimuove un componente dall'assembly.
     */
    public function execute(KitAssembly $assembly, KitAssemblyItem $item, ?int $warehouseId): void
    {
        if ($assembly->status === KitAssemblyStatus::Disassembled) {
            throw new InvalidArgumentException('Impossibile rimuovere componenti da un\'assembly smontata.');
        }

        if ($item->kit_assembly_id !== $assembly->id) {
            throw new InvalidArgumentException('Il componente non appartiene a questa assembly.');
        }

        DB::transaction(function () use ($item) {
            $item->delete();
        });
    }
}
