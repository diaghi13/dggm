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
            // Default billing unit for SERVICE-type products.
            // Auto-fills billing_unit when a service product is added to a quote labor item.
            // Examples: 'day' for "Fonico", 'hour' for "Consulenza", 'flat' for "Trasporto"
            $table->string('billing_unit_default')->nullable()->after('product_type');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('billing_unit_default');
        });
    }
};
