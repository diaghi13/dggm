<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Rename materials table to products
     */
    public function up(): void
    {
        // Only rename if materials exists and products doesn't
        if (Schema::hasTable('materials') && ! Schema::hasTable('products')) {
            Schema::rename('materials', 'products');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Only rename back if products exists and materials doesn't
        if (Schema::hasTable('products') && ! Schema::hasTable('materials')) {
            Schema::rename('products', 'materials');
        }
    }
};
