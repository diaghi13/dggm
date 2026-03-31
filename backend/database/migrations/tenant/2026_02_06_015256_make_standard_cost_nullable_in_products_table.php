<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Make standard_cost nullable and set to NULL for non-inventoriable products.
     * - SERVICE and COMPOSITE products don't have inventory, so standard_cost = NULL
     * - ARTICLE products keep their existing standard_cost values
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // First, set NULL for service and composite products
            DB::table('products')
                ->whereIn('product_type', ['service', 'composite'])
                ->update(['standard_cost' => null]);

            // Then make the column nullable
            $table->decimal('standard_cost', 10, 2)
                ->nullable()
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Set default 0 for NULL values before making NOT NULL
            DB::table('products')
                ->whereNull('standard_cost')
                ->update(['standard_cost' => 0]);

            $table->decimal('standard_cost', 10, 2)
                ->nullable(false)
                ->change();
        });
    }
};
