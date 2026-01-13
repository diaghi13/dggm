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
        Schema::create('site_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('sites')->cascadeOnDelete();
            $table->foreignId('material_id')->constrained('materials')->cascadeOnDelete();
            $table->foreignId('quote_item_id')->nullable()->constrained('quote_items')->nullOnDelete(); // Link a preventivo

            // Quantità
            $table->decimal('planned_quantity', 10, 2); // Da preventivo o pianificato
            $table->decimal('allocated_quantity', 10, 2)->default(0); // Riservato da warehouse
            $table->decimal('delivered_quantity', 10, 2)->default(0); // Consegnato al cantiere
            $table->decimal('used_quantity', 10, 2)->default(0); // Effettivamente utilizzato
            $table->decimal('returned_quantity', 10, 2)->default(0); // Restituito a magazzino

            // Costi
            $table->decimal('planned_unit_cost', 10, 2)->default(0);
            $table->decimal('actual_unit_cost', 10, 2)->default(0);

            // Status e tracking
            $table->string('status')->default('planned'); // planned, reserved, delivered, in_use, completed
            $table->date('required_date')->nullable(); // Data necessità
            $table->date('delivery_date')->nullable(); // Data consegna effettiva

            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['site_id', 'status']);
            $table->index(['material_id', 'site_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_materials');
    }
};
