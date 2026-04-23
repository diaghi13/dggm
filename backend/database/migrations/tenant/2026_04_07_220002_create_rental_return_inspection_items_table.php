<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_return_inspection_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->constrained('rental_return_inspections')->cascadeOnDelete();
            $table->foreignId('ddt_item_id')->constrained('ddt_items')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->decimal('total_quantity', 10, 2);
            $table->decimal('quantity_good', 10, 2)->default(0);
            $table->decimal('quantity_damaged', 10, 2)->default(0);
            $table->decimal('quantity_write_off', 10, 2)->default(0);
            $table->enum('condition', ['good', 'minor_damage', 'major_damage', 'write_off'])->nullable();
            $table->text('damage_description')->nullable();
            $table->decimal('repair_estimate', 10, 2)->nullable();
            $table->enum('action', ['return_to_stock', 'quarantine', 'write_off'])->nullable();
            $table->foreignId('incident_id')->nullable()->constrained('project_material_incidents')->nullOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_return_inspection_items');
    }
};
