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
        Schema::table('project_labor_logs', function (Blueprint $table) {
            $table->string('overtime_cause')->nullable()->after('rejection_reason');
            $table->boolean('is_billable_to_client')->default(false)->after('overtime_cause');
            $table->decimal('overtime_rate_multiplier', 4, 2)->default(1.00)->after('is_billable_to_client');
            $table->boolean('include_in_final_balance')->default(true)->after('overtime_rate_multiplier');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_labor_logs', function (Blueprint $table) {
            $table->dropColumn([
                'overtime_cause',
                'is_billable_to_client',
                'overtime_rate_multiplier',
                'include_in_final_balance',
            ]);
        });
    }
};
