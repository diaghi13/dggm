<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')->constrained('materials')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->decimal('quantity_available', 10, 2)->default(0); // Stock disponibile
            $table->decimal('quantity_reserved', 10, 2)->default(0); // Riservato per cantieri
            $table->decimal('quantity_in_transit', 10, 2)->default(0); // In transito
            $table->decimal('minimum_stock', 10, 2)->default(0); // Scorta minima
            $table->decimal('maximum_stock', 10, 2)->nullable(); // Scorta massima
            $table->date('last_count_date')->nullable(); // Ultima inventario fisico
            $table->timestamps();

            $table->unique(['material_id', 'warehouse_id']); // Un materiale una sola riga per warehouse
            $table->index(['material_id', 'warehouse_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory');
    }
};
