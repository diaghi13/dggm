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
        Schema::create('ddt_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ddt_id')->constrained('ddts')->cascadeOnDelete();
            $table->foreignId('material_id')->constrained('materials')->cascadeOnDelete();
            $table->decimal('quantity', 10, 2);
            $table->string('unit', 20);
            $table->decimal('unit_cost', 10, 2)->nullable(); // Solo per DDT incoming (fornitore)
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['ddt_id', 'material_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ddt_items');
    }
};
