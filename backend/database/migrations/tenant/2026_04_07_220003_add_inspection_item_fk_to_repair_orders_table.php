<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('repair_orders', function (Blueprint $table) {
            $table->foreign('inspection_item_id')
                ->references('id')
                ->on('rental_return_inspection_items')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('repair_orders', function (Blueprint $table) {
            $table->dropForeign(['inspection_item_id']);
        });
    }
};
