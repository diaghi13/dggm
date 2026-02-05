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
            // Brand relationship
            $table->foreignId('brand_id')->nullable()->after('category_id')->constrained('product_brands')->nullOnDelete();

            // Product codes
            $table->string('internal_code', 50)->unique()->nullable()->after('code')->comment('Auto-generated fake code for customers (e.g. BTI-PUSILCO)');
            $table->string('ean', 13)->nullable()->after('internal_code')->comment('International barcode (EAN-13)');
            $table->string('etim_code', 20)->nullable()->after('ean')->comment('ETIM classification code');

            // Indexes
            $table->index('internal_code');
            $table->index('ean');
            $table->index('etim_code');
            $table->index('brand_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['brand_id']);
            $table->dropIndex(['internal_code', 'ean', 'etim_code', 'brand_id']);
            $table->dropColumn([
                'brand_id',
                'internal_code',
                'ean',
                'etim_code',
            ]);
        });
    }
};
