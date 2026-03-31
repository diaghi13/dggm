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
        Schema::table('quote_items', function (Blueprint $table) {
            $table->string('billing_unit')->default('unit')->after('unit');
            $table->decimal('duration', 10, 2)->nullable()->after('billing_unit');
            $table->boolean('is_degressive')->default(false)->after('duration');
        });
    }

    public function down(): void
    {
        Schema::table('quote_items', function (Blueprint $table) {
            $table->dropColumn(['billing_unit', 'duration', 'is_degressive']);
        });
    }
};
