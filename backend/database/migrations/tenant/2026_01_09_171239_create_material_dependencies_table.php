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
        Schema::create('material_dependencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')->constrained('materials')->cascadeOnDelete();
            $table->foreignId('dependency_material_id')->constrained('materials')->cascadeOnDelete();

            // Tipo di dipendenza
            $table->enum('dependency_type', ['container', 'accessory', 'cable', 'consumable', 'tool'])
                ->default('accessory');

            // Tipo di calcolo quantità
            $table->enum('quantity_type', ['fixed', 'ratio', 'formula'])
                ->default('ratio');

            // Valore per calcolo
            $table->string('quantity_value')->default('1'); // '1' per fixed, '1.0' per ratio, 'ceil(qty/6)' per formula

            // Comportamento
            $table->boolean('is_visible_in_quote')->default(false); // Mostra nel preventivo al cliente
            $table->boolean('is_required_for_stock')->default(true); // Obbligatorio per scarico magazzino
            $table->boolean('is_optional')->default(false); // Opzionale (chiedi conferma)

            // Condizioni
            $table->decimal('min_quantity_trigger', 10, 2)->nullable(); // Scatta solo se qty >= X
            $table->decimal('max_quantity_trigger', 10, 2)->nullable(); // Scatta solo se qty <= X

            $table->text('notes')->nullable();
            $table->timestamps();

            // Indici e constraint
            $table->unique(['material_id', 'dependency_material_id']);
            $table->index(['material_id', 'dependency_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('material_dependencies');
    }
};
