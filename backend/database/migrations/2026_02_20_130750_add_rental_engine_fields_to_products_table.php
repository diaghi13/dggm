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
            $table->enum('ownership_type', ['owned', 'subrental', 'mixed'])
                ->default('owned')
                ->after('is_rentable');
            $table->boolean('is_premium')->default(false)->after('ownership_type');
            $table->decimal('subrental_markup', 5, 2)->nullable()->after('is_premium');
            $table->boolean('rental_price_estimated')->default(false)->after('subrental_markup');
            $table->decimal('estimated_base_day', 10, 2)->nullable()->after('rental_price_estimated');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['ownership_type', 'is_premium', 'subrental_markup', 'rental_price_estimated', 'estimated_base_day']);
        });
    }
};
