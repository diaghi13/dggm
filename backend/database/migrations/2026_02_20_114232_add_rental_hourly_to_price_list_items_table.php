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
        Schema::table('price_list_items', function (Blueprint $table) {
            $table->decimal('rental_hourly', 10, 2)->nullable()->after('rental_daily');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('price_list_items', function (Blueprint $table) {
            $table->dropColumn('rental_hourly');
        });
    }
};
