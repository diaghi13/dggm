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
        Schema::create('product_subrental_suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
            $table->decimal('day_rate', 10, 2)->comment('Costo giornaliero del fornitore per questo prodotto');
            $table->decimal('reliability_score', 3, 1)->default(3.0)->comment('Score affidabilità 0.0–5.0');
            $table->boolean('is_preferred')->default(false)->comment('Fornitore preferito manualmente');
            $table->date('last_updated')->nullable()->comment('Data ultimo aggiornamento prezzo');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['product_id', 'supplier_id']);
            $table->index('product_id');
            $table->index('supplier_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_subrental_suppliers');
    }
};
