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
        Schema::create('inventory_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->decimal('quantity', 10, 2);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('type');          // rental_booking | project_material | sale_order
            $table->nullableMorphs('reference'); // reference_type + reference_id
            $table->string('status');        // pending | confirmed | active | completed | cancelled
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['product_id', 'warehouse_id', 'start_date', 'end_date'], 'inv_res_product_warehouse_dates_idx');
            $table->index(['status', 'start_date'], 'inv_res_status_date_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_reservations');
    }
};
