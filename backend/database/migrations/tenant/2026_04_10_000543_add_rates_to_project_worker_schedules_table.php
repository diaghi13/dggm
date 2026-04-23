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
        Schema::table('project_worker_schedules', function (Blueprint $table) {
            $table->decimal('cost_rate', 10, 2)->nullable()->after('planned_hours')
                ->comment('Override tariff: null = inherit from project_worker.actual_cost_rate');
            $table->decimal('customer_rate', 10, 2)->nullable()->after('cost_rate')
                ->comment('Override customer tariff: null = inherit from project_worker.customer_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_worker_schedules', function (Blueprint $table) {
            $table->dropColumn(['cost_rate', 'customer_rate']);
        });
    }
};
