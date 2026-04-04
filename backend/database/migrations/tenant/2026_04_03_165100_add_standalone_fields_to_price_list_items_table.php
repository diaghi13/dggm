<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('price_list_items', function (Blueprint $table) {
            // Drop existing FK constraint
            $table->dropForeign(['product_id']);

            // Make product_id nullable
            $table->foreignId('product_id')->nullable()->change();

            // Re-add FK with nullOnDelete (item survives product deletion)
            $table->foreign('product_id')->references('id')->on('products')->nullOnDelete();

            // Add standalone fields
            $table->string('name', 255)->nullable()->after('product_id');
            $table->string('code', 100)->nullable()->after('name');
            $table->string('unit', 50)->nullable()->after('code');
            $table->decimal('vat_rate', 5, 2)->nullable()->after('unit');
        });
    }

    public function down(): void
    {
        Schema::table('price_list_items', function (Blueprint $table) {
            // Drop new columns
            $table->dropColumn(['name', 'code', 'unit', 'vat_rate']);

            // Drop nullable FK
            $table->dropForeign(['product_id']);

            // Restore NOT NULL
            $table->foreignId('product_id')->nullable(false)->change();

            // Re-add original cascadeOnDelete FK
            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
        });
    }
};
