<?php

namespace App\Domains\Warehouse\Providers;

use App\Domains\Warehouse\Repositories\WarehouseEloquentRepository;
use App\Domains\Warehouse\Repositories\WarehouseRepository;
use Illuminate\Support\ServiceProvider;

/**
 * WarehouseServiceProvider
 *
 * Registra i binding per il domain Warehouse.
 * IMPORTANTE: binding dell'interfaccia Repository all'implementazione Eloquent.
 */
class WarehouseServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Bind WarehouseRepository interface to Eloquent implementation
        // Questo permette dependency injection automatica
        $this->app->bind(
            WarehouseRepository::class,
            WarehouseEloquentRepository::class
        );

        // Se volessimo un singleton (stessa istanza riutilizzata):
        // $this->app->singleton(WarehouseRepository::class, WarehouseEloquentRepository::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
