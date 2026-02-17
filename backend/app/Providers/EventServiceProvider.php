<?php

namespace App\Providers;

use App\Events\BulkProductPricesUpdated;
use App\Events\DdtCancelled;
use App\Events\DdtConfirmed;
use App\Events\DdtCreated;
use App\Events\DdtDeleted;
use App\Events\DdtDelivered;
use App\Events\DdtUpdated;
use App\Events\InventoryAdjusted;
use App\Events\InventoryLowStock;
use App\Events\InventoryReservationReleased;
use App\Events\InventoryReserved;
use App\Events\PasswordChanged;
use App\Events\PasswordReset;
use App\Events\PasswordResetRequested;
use App\Events\PriceListGenerated;
use App\Events\PriceListItemsGenerationCompleted;
use App\Events\QuoteApproved;
use App\Events\QuoteConvertedToSite;
use App\Events\QuoteCreated;
use App\Events\QuoteDeleted;
use App\Events\QuoteRejected;
use App\Events\QuoteSent;
use App\Events\QuoteUpdated;
use App\Events\SettingCreated;
use App\Events\SettingDeleted;
use App\Events\SettingUpdated;
use App\Events\StockMovementCreated;
use App\Events\StockMovementReversed;
use App\Listeners\CheckLowStockAfterMovementListener;
use App\Listeners\ClearQuotePdfCacheOnUpdate;
use App\Listeners\GeneratePriceListItemsListener;
use App\Listeners\GenerateStockMovementsListener;
use App\Listeners\InvalidatePricingCache;
use App\Listeners\InvalidateSettingCache;
use App\Listeners\LogDdtActivityListener;
use App\Listeners\LogInventoryAdjustmentListener;
use App\Listeners\LogInventoryReservationListener;
use App\Listeners\LogPasswordActivity;
use App\Listeners\LogPriceListGeneration;
use App\Listeners\LogQuoteActivity;
use App\Listeners\LogStockMovementListener;
use App\Listeners\LogWarehouseActivity;
use App\Listeners\NotifyPriceListGenerationCompleted;
use App\Listeners\NotifyProjectManagerOfQuoteApproval;
use App\Listeners\NotifyWarehouseManagerListener;
use App\Listeners\ReverseStockMovementsListener;
use App\Listeners\SendLowStockAlert;
use App\Listeners\UpdateProductStandardCostListener;
use App\Listeners\UpdateSiteMaterialsListener;
use App\Listeners\UpdateWarehouseCache;
use App\Listeners\UpsertSupplierProductFromDdtListener;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        // Warehouse Events (UpdateWarehouseCache is in $subscribe, not here)

        // Inventory Events
        InventoryAdjusted::class => [
            LogInventoryAdjustmentListener::class,
        ],
        InventoryLowStock::class => [
            SendLowStockAlert::class,
        ],
        InventoryReserved::class => [
            LogInventoryReservationListener::class,
        ],
        InventoryReservationReleased::class => [
            LogInventoryReservationListener::class,
        ],

        // StockMovement Events
        StockMovementCreated::class => [
            CheckLowStockAfterMovementListener::class,
            LogStockMovementListener::class,
            UpdateProductStandardCostListener::class,
        ],
        StockMovementReversed::class => [
            LogStockMovementListener::class,
        ],

        // DDT Events
        DdtCreated::class => [
            LogDdtActivityListener::class,
        ],
        DdtUpdated::class => [
            LogDdtActivityListener::class,
        ],
        DdtConfirmed::class => [
            GenerateStockMovementsListener::class, // MUST run first
            UpsertSupplierProductFromDdtListener::class, // Auto-populate supplier_product
            NotifyWarehouseManagerListener::class,
            LogDdtActivityListener::class,
        ],
        DdtCancelled::class => [
            ReverseStockMovementsListener::class, // MUST run first
            NotifyWarehouseManagerListener::class,
            LogDdtActivityListener::class,
        ],
        DdtDelivered::class => [
            UpdateSiteMaterialsListener::class, // MUST run first
            NotifyWarehouseManagerListener::class,
            LogDdtActivityListener::class,
        ],
        DdtDeleted::class => [
            LogDdtActivityListener::class,
        ],

        // Setting Events
        SettingCreated::class => [
            InvalidateSettingCache::class.'@handleCreated',
        ],
        SettingUpdated::class => [
            InvalidateSettingCache::class.'@handleUpdated',
        ],
        SettingDeleted::class => [
            InvalidateSettingCache::class.'@handleDeleted',
        ],

        // Password Events
        PasswordResetRequested::class => [
            LogPasswordActivity::class,
        ],
        PasswordReset::class => [
            LogPasswordActivity::class,
        ],
        PasswordChanged::class => [
            LogPasswordActivity::class,
        ],

        // Pricing Events
        PriceListGenerated::class => [
            GeneratePriceListItemsListener::class, // MUST run first (dispatches batch jobs)
            LogPriceListGeneration::class,
            InvalidatePricingCache::class,
        ],
        BulkProductPricesUpdated::class => [
            InvalidatePricingCache::class,
        ],
        PriceListItemsGenerationCompleted::class => [
            NotifyPriceListGenerationCompleted::class,
        ],

        // Quote Events
        QuoteCreated::class => [
            LogQuoteActivity::class,
        ],
        QuoteUpdated::class => [
            LogQuoteActivity::class,
            ClearQuotePdfCacheOnUpdate::class,
        ],
        QuoteSent::class => [
            LogQuoteActivity::class,
        ],
        QuoteApproved::class => [
            LogQuoteActivity::class,
            NotifyProjectManagerOfQuoteApproval::class,
        ],
        QuoteRejected::class => [
            LogQuoteActivity::class,
        ],
        QuoteDeleted::class => [
            LogQuoteActivity::class,
        ],
        QuoteConvertedToSite::class => [
            LogQuoteActivity::class,
        ],
    ];

    /**
     * The subscriber classes to register.
     *
     * @var array<int, class-string>
     */
    protected $subscribe = [
        LogWarehouseActivity::class,
        UpdateWarehouseCache::class,
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
