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
        Schema::table('product_subrental_suppliers', function (Blueprint $table) {
            $table->decimal('day_rate', 10, 2)->nullable()->comment('Costo giornaliero del fornitore per questo prodotto')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_subrental_suppliers', function (Blueprint $table) {
            $table->decimal('day_rate', 10, 2)->nullable(false)->comment('Costo giornaliero del fornitore per questo prodotto')->change();
        });
    }
};
