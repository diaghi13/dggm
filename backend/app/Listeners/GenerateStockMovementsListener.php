<?php

namespace App\Listeners;

use App\Domains\Warehouse\Actions\Ddt\ProcessIncomingDdtAction;
use App\Domains\Warehouse\Actions\Ddt\ProcessInternalDdtAction;
use App\Domains\Warehouse\Actions\Ddt\ProcessOutgoingDdtAction;
use App\Domains\Warehouse\Actions\Ddt\ProcessRentalOutDdtAction;
use App\Domains\Warehouse\Actions\Ddt\ProcessRentalReturnDdtAction;
use App\Domains\Warehouse\Actions\Ddt\ProcessReturnFromCustomerDdtAction;
use App\Domains\Warehouse\Actions\Ddt\ProcessReturnToSupplierDdtAction;
use App\Enums\DdtType;
use App\Enums\KitAssemblyStatus;
use App\Events\DdtConfirmed;
use Illuminate\Support\Facades\Log;

/**
 * GenerateStockMovementsListener
 *
 * CRITICAL LISTENER - Generates stock movements when a DDT is confirmed.
 * Must run synchronously (NOT queued) — runs inside ConfirmDdtAction's DB::transaction.
 */
class GenerateStockMovementsListener
{
    public function __construct(
        private readonly ProcessIncomingDdtAction $incoming,
        private readonly ProcessOutgoingDdtAction $outgoing,
        private readonly ProcessInternalDdtAction $internal,
        private readonly ProcessRentalOutDdtAction $rentalOut,
        private readonly ProcessRentalReturnDdtAction $rentalReturn,
        private readonly ProcessReturnFromCustomerDdtAction $returnFromCustomer,
        private readonly ProcessReturnToSupplierDdtAction $returnToSupplier,
    ) {}

    public function handle(DdtConfirmed $event): void
    {
        $ddt = $event->ddt->fresh(['items.product', 'items.kitAssembly', 'fromWarehouse', 'toWarehouse']);

        match ($ddt->type) {
            DdtType::Incoming => $this->incoming->execute($ddt),
            DdtType::Outgoing => $this->outgoing->execute($ddt),
            DdtType::Internal => $this->internal->execute($ddt),
            DdtType::RentalOut => $this->rentalOut->execute($ddt),
            DdtType::RentalReturn => $this->rentalReturn->execute($ddt),
            DdtType::ReturnFromCustomer => $this->returnFromCustomer->execute($ddt),
            DdtType::ReturnToSupplier => $this->returnToSupplier->execute($ddt),
        };

        if (in_array($ddt->type, [DdtType::Outgoing, DdtType::RentalOut])) {
            $this->syncKitAssemblyStatuses($ddt);
        }

        Log::info('Stock movements generated for DDT', [
            'ddt_id' => $ddt->id,
            'ddt_code' => $ddt->code,
            'type' => $ddt->type->value,
            'items_count' => $ddt->items->count(),
        ]);
    }

    private function syncKitAssemblyStatuses($ddt): void
    {
        foreach ($ddt->items as $item) {
            if ($item->kit_assembly_id && $item->kitAssembly) {
                $assembly = $item->kitAssembly;

                if (in_array($assembly->status, [
                    KitAssemblyStatus::Assembled,
                    KitAssemblyStatus::Returned,
                ])) {
                    $assembly->update(['status' => KitAssemblyStatus::InUse]);
                }
            }
        }
    }
}
