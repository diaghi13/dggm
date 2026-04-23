<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_labor_logs', function (Blueprint $table) {
            $table->unsignedSmallInteger('break_minutes')->default(0)->after('clock_out');
            $table->string('overtime_rate_type')->nullable()->after('overtime_rate_multiplier')->comment('multiplier | direct_rate');
            $table->decimal('overtime_direct_rate', 10, 2)->nullable()->after('overtime_rate_type');
            $table->boolean('is_auto_approved')->default(false)->after('approved_at');
        });
    }

    public function down(): void
    {
        Schema::table('project_labor_logs', function (Blueprint $table) {
            $table->dropColumn([
                'break_minutes',
                'overtime_rate_type',
                'overtime_direct_rate',
                'is_auto_approved',
            ]);
        });
    }
};
