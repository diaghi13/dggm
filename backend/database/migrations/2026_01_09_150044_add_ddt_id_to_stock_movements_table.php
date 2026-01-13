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
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('ddt_id')->nullable()->after('code')->constrained('ddts')->nullOnDelete();
            $table->index('ddt_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['ddt_id']);
            $table->dropIndex(['ddt_id']);
            $table->dropColumn('ddt_id');
        });
    }
};
