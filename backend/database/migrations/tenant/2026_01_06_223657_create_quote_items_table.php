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
        Schema::create('quote_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_id')->constrained()->onDelete('cascade');
            $table->foreignId('parent_id')->nullable()->constrained('quote_items')->onDelete('cascade');

            // Type: section (categoria), item (voce), or labor/material
            $table->enum('type', ['section', 'item', 'labor', 'material'])->default('item');

            $table->string('code')->nullable(); // Codice voce (es. 01.01)
            $table->string('description');
            $table->text('notes')->nullable();

            // Ordering
            $table->integer('sort_order')->default(0);

            // Quantities and pricing (null for sections)
            $table->string('unit')->nullable(); // m2, m3, kg, ore, cad, etc.
            $table->decimal('quantity', 10, 2)->nullable();
            $table->decimal('unit_price', 12, 2)->nullable();
            $table->decimal('discount_percentage', 5, 2)->default(0);

            // Calculated fields
            $table->decimal('subtotal', 12, 2)->default(0); // quantity * unit_price
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0); // subtotal - discount

            $table->timestamps();

            $table->index('quote_id');
            $table->index('parent_id');
            $table->index(['quote_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quote_items');
    }
};
