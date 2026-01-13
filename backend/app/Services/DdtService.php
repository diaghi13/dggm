<?php

namespace App\Services;

use App\Enums\DdtStatus;
use App\Enums\DdtType;
use App\Enums\StockMovementType;
use App\Models\Ddt;
use App\Models\Inventory;
use App\Models\StockMovement;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class DdtService
{
    public function __construct(
        private readonly InventoryService $inventoryService
    ) {}

    public function getAll(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Ddt::with([
            'supplier',
            'customer',
            'site',
            'fromWarehouse',
            'toWarehouse',
            'items.material',
            'createdBy',
        ]);

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['warehouse_id'])) {
            $query->forWarehouse($filters['warehouse_id']);
        }

        if (! empty($filters['site_id'])) {
            $query->forSite($filters['site_id']);
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('code', 'like', "%{$filters['search']}%")
                    ->orWhere('ddt_number', 'like', "%{$filters['search']}%");
            });
        }

        $sortBy = $filters['sort_by'] ?? 'ddt_date';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate(min($perPage, 100));
    }

    public function getById(int $id): Ddt
    {
        return Ddt::with([
            'supplier',
            'customer',
            'site',
            'fromWarehouse',
            'toWarehouse',
            'items.material',
            'createdBy',
            'stockMovements',
            'parentDdt',
        ])->findOrFail($id);
    }

    public function create(array $data): Ddt
    {
        $data['created_by'] = auth()->id();
        $data['status'] = DdtStatus::Draft;

        return DB::transaction(function () use ($data) {
            $items = $data['items'] ?? [];
            unset($data['items']);

            $ddt = Ddt::create($data);

            if (! empty($items)) {
                foreach ($items as $item) {
                    $ddt->items()->create($item);
                }
            }

            return $ddt->fresh(['items.material']);
        });
    }

    public function update(Ddt $ddt, array $data): Ddt
    {
        if (! $ddt->canBeConfirmed()) {
            throw new \Exception('DDT non può essere modificato dopo la conferma.');
        }

        return DB::transaction(function () use ($ddt, $data) {
            $items = $data['items'] ?? null;
            unset($data['items']);

            $ddt->update($data);

            if ($items !== null) {
                $this->syncItems($ddt, $items);
            }

            return $ddt->fresh(['items.material', 'supplier', 'customer', 'site']);
        });
    }

    protected function syncItems(Ddt $ddt, array $items): void
    {
        $existingIds = $ddt->items()->pluck('id')->toArray();
        $incomingIds = collect($items)->pluck('id')->filter()->toArray();

        $toDelete = array_diff($existingIds, $incomingIds);
        if (! empty($toDelete)) {
            $ddt->items()->whereIn('id', $toDelete)->delete();
        }

        foreach ($items as $itemData) {
            if (isset($itemData['id']) && $itemData['id'] > 0 && in_array($itemData['id'], $existingIds)) {
                $ddt->items()->where('id', $itemData['id'])->update($itemData);
            } else {
                unset($itemData['id']);
                $ddt->items()->create($itemData);
            }
        }
    }

    public function delete(Ddt $ddt): bool
    {
        if (! $ddt->canBeCancelled()) {
            throw new \Exception('DDT non può essere eliminato dopo la consegna.');
        }

        return $ddt->delete();
    }

    /**
     * Conferma DDT e genera movimenti automatici
     */
    public function confirmAndProcess(Ddt $ddt): Ddt
    {
        if (! $ddt->canBeConfirmed()) {
            throw new \Exception('DDT non può essere confermato. Stato attuale: '.$ddt->status->value);
        }

        // Validazioni pre-conferma
        $this->validateBeforeConfirm($ddt);

        return DB::transaction(function () use ($ddt) {
            // Aggiorna status
            $ddt->update(['status' => DdtStatus::Issued]);

            // Genera movimenti automatici basati sul tipo
            match ($ddt->type) {
                DdtType::Incoming => $this->processIncoming($ddt),
                DdtType::Outgoing => $this->processOutgoing($ddt),
                DdtType::Internal => $this->processInternal($ddt),
                DdtType::RentalOut => $this->processRentalOut($ddt),
                DdtType::RentalReturn => $this->processRentalReturn($ddt),
                DdtType::ReturnFromCustomer => $this->processReturnFromCustomer($ddt),
                DdtType::ReturnToSupplier => $this->processReturnToSupplier($ddt),
            };

            return $ddt->fresh(['stockMovements', 'items']);
        });
    }

    protected function validateBeforeConfirm(Ddt $ddt): void
    {
        // Verifica che ci siano items
        if ($ddt->items()->count() === 0) {
            throw new \Exception('DDT deve avere almeno un articolo.');
        }

        // Se è outgoing, verifica disponibilità stock
        if ($ddt->type === DdtType::Outgoing || $ddt->type === DdtType::Internal) {
            foreach ($ddt->items as $item) {
                $inventory = Inventory::where('material_id', $item->material_id)
                    ->where('warehouse_id', $ddt->from_warehouse_id)
                    ->first();

                if (! $inventory || $inventory->quantity_free < $item->quantity) {
                    throw new \Exception("Stock insufficiente per {$item->material->name}. Disponibile: ".($inventory->quantity_free ?? 0).', Richiesto: '.$item->quantity);
                }
            }
        }
    }

    protected function processIncoming(Ddt $ddt): void
    {
        foreach ($ddt->items as $item) {
            // Crea movimento carico
            // Carica nel magazzino
            $inventory = Inventory::firstOrCreate([
                'material_id' => $item->material_id,
                'warehouse_id' => $ddt->from_warehouse_id,
            ]);

            $inventory->quantity_available += $item->quantity;
            $inventory->save();

            // Crea movimento carico
            StockMovement::create([
                'code' => StockMovement::generateCode(),
                'ddt_id' => $ddt->id,
                'material_id' => $item->material_id,
                'warehouse_id' => $ddt->from_warehouse_id,
                'type' => StockMovementType::INTAKE,
                'quantity' => $item->quantity,
                'unit_cost' => $item->unit_cost,
                'movement_date' => $ddt->ddt_date,
                'supplier_id' => $ddt->supplier_id,
                'supplier_document' => $ddt->ddt_number,
                'user_id' => auth()->id(),
                'notes' => "Carico da DDT {$ddt->code}",
            ]);
        }
    }

    protected function processOutgoing(Ddt $ddt): void
    {
        foreach ($ddt->items as $item) {
            // Scarica dal magazzino e crea movimento
            $inventory = Inventory::firstOrCreate([
                'material_id' => $item->material_id,
                'warehouse_id' => $ddt->from_warehouse_id,
            ]);

            $inventory->quantity_available -= $item->quantity;
            $inventory->save();

            // Crea movimento scarico
            StockMovement::create([
                'code' => StockMovement::generateCode(),
                'ddt_id' => $ddt->id,
                'material_id' => $item->material_id,
                'warehouse_id' => $ddt->from_warehouse_id,
                'type' => StockMovementType::OUTPUT,
                'quantity' => $item->quantity,
                'unit_cost' => $item->unit_cost,
                'movement_date' => $ddt->ddt_date,
                'site_id' => $ddt->site_id,
                'user_id' => auth()->id(),
                'notes' => 'Scarico verso '.($ddt->site ? "cantiere {$ddt->site->name}" : 'cliente')." - DDT {$ddt->code}",
            ]);

            // NON aggiorniamo site_materials qui - lo faremo alla conferma ricezione
        }
    }

    protected function processInternal(Ddt $ddt): void
    {
        foreach ($ddt->items as $item) {
            // Riduce da origine
            $fromInventory = Inventory::firstOrCreate([
                'material_id' => $item->material_id,
                'warehouse_id' => $ddt->from_warehouse_id,
            ]);
            $fromInventory->quantity_available -= $item->quantity;
            $fromInventory->save();

            // Aumenta in destinazione
            $toInventory = Inventory::firstOrCreate([
                'material_id' => $item->material_id,
                'warehouse_id' => $ddt->to_warehouse_id,
            ]);
            $toInventory->quantity_available += $item->quantity;
            $toInventory->save();

            // Crea movimento trasferimento
            StockMovement::create([
                'code' => StockMovement::generateCode(),
                'ddt_id' => $ddt->id,
                'material_id' => $item->material_id,
                'warehouse_id' => $ddt->from_warehouse_id,
                'type' => StockMovementType::TRANSFER,
                'quantity' => $item->quantity,
                'unit_cost' => $item->unit_cost,
                'movement_date' => $ddt->ddt_date,
                'from_warehouse_id' => $ddt->from_warehouse_id,
                'to_warehouse_id' => $ddt->to_warehouse_id,
                'user_id' => auth()->id(),
                'notes' => "Trasferimento interno - DDT {$ddt->code}",
            ]);
        }
    }

    protected function processRentalOut(Ddt $ddt): void
    {
        foreach ($ddt->items as $item) {
            // Scarico temporaneo per noleggio
            StockMovement::create([
                'code' => StockMovement::generateCode(),
                'ddt_id' => $ddt->id,
                'material_id' => $item->material_id,
                'warehouse_id' => $ddt->from_warehouse_id,
                'type' => StockMovementType::OUTPUT,
                'quantity' => $item->quantity,
                'movement_date' => $ddt->ddt_date,
                'site_id' => $ddt->site_id,
                'user_id' => auth()->id(),
                'notes' => "Noleggio uscita - DDT {$ddt->code}",
            ]);

            // Sposta in reserved (materiale deve rientrare)
            $inventory = Inventory::firstOrCreate([
                'material_id' => $item->material_id,
                'warehouse_id' => $ddt->from_warehouse_id,
            ]);

            $inventory->quantity_available -= $item->quantity;
            $inventory->quantity_reserved += $item->quantity;
            $inventory->save();
        }
    }

    protected function processRentalReturn(Ddt $ddt): void
    {
        foreach ($ddt->items as $item) {
            // Carico rientro noleggio
            StockMovement::create([
                'code' => StockMovement::generateCode(),
                'ddt_id' => $ddt->id,
                'material_id' => $item->material_id,
                'warehouse_id' => $ddt->from_warehouse_id,
                'type' => StockMovementType::Intake,
                'quantity' => $item->quantity,
                'movement_date' => $ddt->ddt_date,
                'user_id' => auth()->id(),
                'notes' => "Rientro noleggio - DDT {$ddt->code}",
            ]);

            // Libera reserved e ripristina available
            $inventory = Inventory::firstOrCreate([
                'material_id' => $item->material_id,
                'warehouse_id' => $ddt->from_warehouse_id,
            ]);

            $inventory->quantity_reserved -= $item->quantity;
            $inventory->quantity_available += $item->quantity;
            $inventory->save();
        }
    }

    protected function processReturnFromCustomer(Ddt $ddt): void
    {
        foreach ($ddt->items as $item) {
            // Carico reso da cliente
            StockMovement::create([
                'code' => StockMovement::generateCode(),
                'ddt_id' => $ddt->id,
                'material_id' => $item->material_id,
                'warehouse_id' => $ddt->from_warehouse_id,
                'type' => StockMovementType::Return,
                'quantity' => $item->quantity,
                'movement_date' => $ddt->ddt_date,
                'user_id' => auth()->id(),
                'notes' => "Reso da cliente: {$ddt->return_reason?->value} - DDT {$ddt->code}",
            ]);

            // Se difettoso → quarantena, altrimenti → available
            $inventory = Inventory::firstOrCreate([
                'material_id' => $item->material_id,
                'warehouse_id' => $ddt->from_warehouse_id,
            ]);

            if ($ddt->return_reason && in_array($ddt->return_reason->value, ['defective', 'warranty'])) {
                // Materiale difettoso → quarantena
                $inventory->quantity_quarantine += $item->quantity;
            } else {
                // Materiale OK → disponibile
                $inventory->quantity_available += $item->quantity;
            }

            $inventory->save();
        }
    }

    protected function processReturnToSupplier(Ddt $ddt): void
    {
        foreach ($ddt->items as $item) {
            // Scarico reso a fornitore
            StockMovement::create([
                'code' => StockMovement::generateCode(),
                'ddt_id' => $ddt->id,
                'material_id' => $item->material_id,
                'warehouse_id' => $ddt->from_warehouse_id,
                'type' => StockMovementType::Return,
                'quantity' => $item->quantity,
                'movement_date' => $ddt->ddt_date,
                'supplier_id' => $ddt->supplier_id,
                'user_id' => auth()->id(),
                'notes' => "Reso a fornitore: {$ddt->return_reason?->value} - DDT {$ddt->code}",
            ]);

            // Riduce da quarantena se presente, altrimenti da available
            $inventory = Inventory::where('material_id', $item->material_id)
                ->where('warehouse_id', $ddt->from_warehouse_id)
                ->first();

            if ($inventory) {
                if ($inventory->quantity_quarantine >= $item->quantity) {
                    $inventory->quantity_quarantine -= $item->quantity;
                } else {
                    $inventory->quantity_available -= $item->quantity;
                }
                $inventory->save();
            }
        }
    }

    protected function updateSiteMaterials(int $siteId, $ddtItem): void
    {
        $siteMaterial = \App\Models\SiteMaterial::where('site_id', $siteId)
            ->where('material_id', $ddtItem->material_id)
            ->first();

        if ($siteMaterial) {
            $siteMaterial->delivered_quantity += $ddtItem->quantity;

            // Auto-update status based on quantities
            $netQuantity = $siteMaterial->delivered_quantity - $siteMaterial->returned_quantity;
            $planned = $siteMaterial->planned_quantity;

            if ($netQuantity == 0) {
                $siteMaterial->status = 'planned'; // Niente ancora consegnato
            } elseif ($netQuantity < $planned) {
                $siteMaterial->status = 'partial'; // Parzialmente consegnato
            } elseif ($netQuantity >= $planned) {
                $siteMaterial->status = 'completed'; // Completato o oltre
            }

            $siteMaterial->save();
        }
    }

    /**
     * Conferma ricezione DDT (da Issued/InTransit a Delivered)
     */
    public function confirm(int $ddtId): Ddt
    {
        $ddt = Ddt::findOrFail($ddtId);

        if ($ddt->status !== DdtStatus::Issued && $ddt->status !== DdtStatus::InTransit) {
            throw new \Exception('DDT può essere confermato solo se è in stato Emesso o In Transito. Stato attuale: '.$ddt->status->value);
        }

        return DB::transaction(function () use ($ddt) {
            // Aggiorna status DDT
            $ddt->update([
                'status' => DdtStatus::Delivered,
                'delivered_at' => now(),
            ]);

            // Se DDT outgoing verso cantiere: aggiorna site_materials
            if ($ddt->type === DdtType::Outgoing && $ddt->site_id) {
                foreach ($ddt->items as $item) {
                    $this->updateSiteMaterials($ddt->site_id, $item);
                }
            }

            return $ddt->fresh(['items']);
        });
    }

    /**
     * Annulla DDT e rollback movimenti
     */
    public function cancel(Ddt $ddt): Ddt
    {
        if (! $ddt->canBeCancelled()) {
            throw new \Exception('DDT non può essere annullato dopo la consegna fisica.');
        }

        return DB::transaction(function () use ($ddt) {
            // Rollback movimenti se presenti
            foreach ($ddt->stockMovements as $movement) {
                $this->rollbackMovement($movement);
            }

            // Elimina movimenti
            $ddt->stockMovements()->delete();

            // Aggiorna status
            $ddt->update(['status' => DdtStatus::Cancelled]);

            return $ddt->fresh();
        });
    }

    protected function rollbackMovement(StockMovement $movement): void
    {
        $inventory = Inventory::where('material_id', $movement->material_id)
            ->where('warehouse_id', $movement->warehouse_id)
            ->first();

        if (! $inventory) {
            return;
        }

        // Inverti il movimento
        if ($movement->type === StockMovementType::INTAKE) {
            $inventory->quantity_available -= $movement->quantity;
        } elseif ($movement->type === StockMovementType::OUTPUT) {
            $inventory->quantity_available += $movement->quantity;
        }

        $inventory->save();
    }
}
