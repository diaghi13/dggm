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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // MOV-20260108-001
            $table->foreignId('material_id')->constrained('materials')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->string('type'); // intake, output, transfer, adjustment, return, waste
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_cost', 10, 2)->nullable(); // Costo al momento movimento
            $table->date('movement_date');

            // Per transfer
            $table->foreignId('from_warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignId('to_warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();

            // Per site allocation
            $table->foreignId('site_id')->nullable()->constrained('sites')->nullOnDelete();

            // Per supplier orders
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->string('supplier_document')->nullable(); // DDT, Fattura

            $table->foreignId('user_id')->constrained('users'); // Chi ha fatto movimento
            $table->text('notes')->nullable();
            $table->string('reference_document')->nullable(); // Numero documento riferimento
            $table->timestamps();

            $table->index(['material_id', 'movement_date']);
            $table->index(['warehouse_id', 'movement_date']);
            $table->index(['site_id', 'movement_date']);
            $table->index('type');
            $table->index('code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
