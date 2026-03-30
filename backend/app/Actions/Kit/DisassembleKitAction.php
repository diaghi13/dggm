<?php

namespace App\Actions\Kit;

use App\Enums\KitAssemblyStatus;
use App\Events\KitDisassembled;
use App\Models\KitAssembly;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class DisassembleKitAction
{
    /**
     * @param  KitAssembly  $assembly  L'assembly da smontare
     * @param  int|null  $warehouseId  Mantenuto per compatibilità (non usato — lo stock è gestito via DDT)
     */
    public function execute(KitAssembly $assembly, ?int $warehouseId): KitAssembly
    {
        if ($assembly->status === KitAssemblyStatus::Disassembled) {
            throw new InvalidArgumentException('L\'assembly è già smontata.');
        }

        return DB::transaction(function () use ($assembly) {
            $assembly->load(['items', 'product']);

            $assembly->update([
                'status' => KitAssemblyStatus::Disassembled,
                'disassembled_at' => now(),
                'disassembled_by_user_id' => auth()->id(),
            ]);

            KitDisassembled::dispatch($assembly, ['user_id' => auth()->id()]);

            return $assembly->fresh()->load(['items.product', 'product']);
        });
    }
}
