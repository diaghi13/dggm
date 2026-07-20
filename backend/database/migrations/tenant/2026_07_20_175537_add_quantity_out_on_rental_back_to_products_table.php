<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('products', 'quantity_out_on_rental')) {
            Schema::table('products', function (Blueprint $table) {
                $table->integer('quantity_out_on_rental')->default(0)->after('is_rentable');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('products', 'quantity_out_on_rental')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('quantity_out_on_rental');
            });
        }
    }
};
