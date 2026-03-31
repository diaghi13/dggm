<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add advanced pricing fields to products table:
     * - Manufacturer suggested prices (reference only)
     * - Product-specific markup override
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Manufacturer suggested prices (reference only)
            $table->decimal('manufacturer_cost_price', 10, 2)
                ->nullable()
                ->after('unit')
                ->comment('Manufacturer suggested cost to suppliers (for estimates)');

            $table->decimal('manufacturer_retail_price', 10, 2)
                ->nullable()
                ->after('manufacturer_cost_price')
                ->comment('Manufacturer suggested retail price MSRP (fallback if no price list)');

            // Product-specific markup override
            $table->decimal('sale_markup_percent', 5, 2)
                ->nullable()
                ->after('manufacturer_retail_price')
                ->comment('Override default markup % (null = use system default 30%)');

            // Index for queries
            $table->index(['manufacturer_retail_price', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['manufacturer_retail_price', 'is_active']);

            $table->dropColumn([
                'manufacturer_cost_price',
                'manufacturer_retail_price',
                'sale_markup_percent',
            ]);
        });
    }
};
