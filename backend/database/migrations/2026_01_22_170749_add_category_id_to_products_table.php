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
            // Add category_id FK column after category (string)
            $table->foreignId('category_id')
                ->nullable()
                ->after('category')
                ->constrained('product_categories')
                ->onDelete('set null');
        });

        // TODO: Migrate existing data from products.category (string) to category_id (FK)
        // This will be done in a separate migration/seeder after testing
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropColumn('category_id');
        });
    }
};
