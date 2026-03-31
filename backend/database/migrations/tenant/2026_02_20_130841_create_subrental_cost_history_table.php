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
        Schema::create('subrental_cost_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
            $table->foreignId('quote_id')->nullable()->constrained('quotes')->nullOnDelete();
            $table->decimal('actual_cost', 10, 2)->comment('Costo totale effettivo pagato al fornitore');
            $table->decimal('duration_days', 10, 2)->comment('Durata effettiva in giorni');
            $table->decimal('margin_generated', 10, 2)->nullable()->comment('Margine = prezzo cliente - costo fornitore');
            $table->date('date')->comment('Data del noleggio');
            $table->timestamps();

            $table->index('product_id');
            $table->index('supplier_id');
            $table->index('quote_id');
            $table->index('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subrental_cost_history');
    }
};
