<?php

namespace App\Actions\Kit;

use App\Models\KitAssembly;
use Illuminate\Support\Facades\DB;

class UpdateKitAssemblyAction
{
    /**
     * Aggiorna metadati dell'assembly (nome, posizione, note, status).
     * Non gestisce movimenti di stock — per assemblare/smontare usa le action dedicate.
     */
    public function execute(KitAssembly $assembly, array $data): KitAssembly
    {
        return DB::transaction(function () use ($assembly, $data) {
            $assembly->update($data);

            return $assembly->fresh()->load(['items.product', 'product']);
        });
    }
}
