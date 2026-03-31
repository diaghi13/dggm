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
        Schema::table('quotes', function (Blueprint $table) {
            // Giorni fatturabili (usage period) — separato dai giorni logistici (work_start/end_date)
            // null = auto-calcolato da work_end_date - work_start_date
            $table->unsignedSmallInteger('event_days')->nullable()->after('quote_type');
        });
    }

    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropColumn('event_days');
        });
    }
};
