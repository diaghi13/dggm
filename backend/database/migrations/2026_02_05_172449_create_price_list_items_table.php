<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Create price_list_items table for product-specific pricing
     * in each price list. Single sale_price field (no calculated + override).
     */
    public function up(): void
    {
        Schema::create('price_list_items', function (Blueprint $table) {
            $table->id();

            // Foreign keys
            $table->foreignId('price_list_id')
                ->constrained('price_lists')
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();

            // Sale price (net, VAT excluded)
            $table->decimal('sale_price', 10, 2)
                ->comment('Sale price net (inserted or calculated)');

            $table->boolean('is_manual_price')
                ->default(false)
                ->comment('true=manual, false=auto-calculated');

            // Rental prices (net, VAT excluded)
            $table->decimal('rental_daily', 10, 2)->nullable();
            $table->decimal('rental_weekly', 10, 2)->nullable();
            $table->decimal('rental_monthly', 10, 2)->nullable();

            $table->boolean('is_manual_rental')
                ->default(false)
                ->comment('true=manual rental, false=calculated from sale_price');

            // Status and notes
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();

            $table->timestamps();

            // Constraints and indexes
            $table->unique(['price_list_id', 'product_id']);
            $table->index(['price_list_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('price_list_items');
    }
};
