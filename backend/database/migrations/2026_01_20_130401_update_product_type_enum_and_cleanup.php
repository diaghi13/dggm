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
     * Update product_type enum values and cleanup redundant columns
     * NOTE: Tables were already renamed from materials → products manually/previously
     */
    public function up(): void
    {
        // Only run if products table exists (skip for fresh test database)
        if (! Schema::hasTable('products')) {
            return;
        }

        // 1. Update product_type enum values
        // 'physical' → 'article', 'kit' → 'composite', 'service' unchanged
        DB::statement("UPDATE products SET product_type = 'article' WHERE product_type = 'physical'");
        DB::statement("UPDATE products SET product_type = 'composite' WHERE product_type = 'kit'");

        // 2. Update default value for product_type column (only for MySQL/PostgreSQL)
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE products ALTER COLUMN product_type SET DEFAULT 'article'");
        }

        // 3. Remove is_kit column (redundant with product_type = 'composite')
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'is_kit')) {
                $table->dropColumn('is_kit');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Re-add is_kit column
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_kit')->default(false)->after('product_type');
        });

        // 2. Sync is_kit with product_type
        DB::statement("UPDATE products SET is_kit = true WHERE product_type = 'composite'");

        // 3. Restore old enum values
        DB::statement("UPDATE products SET product_type = 'physical' WHERE product_type = 'article'");
        DB::statement("UPDATE products SET product_type = 'kit' WHERE product_type = 'composite'");

        // 4. Restore default value
        DB::statement("ALTER TABLE products ALTER COLUMN product_type SET DEFAULT 'physical'");
    }
};
