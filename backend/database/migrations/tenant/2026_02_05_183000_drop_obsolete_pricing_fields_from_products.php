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
        Schema::table('products', function (Blueprint $table) {
            // Drop obsolete pricing columns
            $table->dropColumn([
                'purchase_price',
                'sale_price',
                'markup_percentage',
                'rental_price_daily',
                'rental_price_weekly',
                'rental_price_monthly',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Restore columns for rollback
            $table->decimal('purchase_price', 10, 2)->nullable()->after('unit');
            $table->decimal('sale_price', 10, 2)->nullable()->after('purchase_price');
            $table->decimal('markup_percentage', 5, 2)->nullable()->after('sale_price');
            $table->decimal('rental_price_daily', 10, 2)->nullable()->after('markup_percentage');
            $table->decimal('rental_price_weekly', 10, 2)->nullable()->after('rental_price_daily');
            $table->decimal('rental_price_monthly', 10, 2)->nullable()->after('rental_price_weekly');
        });
    }
};
