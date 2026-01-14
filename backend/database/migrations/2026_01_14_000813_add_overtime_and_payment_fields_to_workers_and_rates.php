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
        // Add payment notes to workers table
        Schema::table('workers', function (Blueprint $table) {
            $table->text('payment_notes')->nullable()->after('notes');
            // For custom payment agreements (e.g., "50% payroll, 50% cash", "70% bank transfer, 30% cash")
        });

        // Add overtime and forfait fields to worker_rates table
        Schema::table('worker_rates', function (Blueprint $table) {
            // Overtime configuration
            $table->decimal('overtime_starts_after_hours', 4, 2)->nullable()->after('overtime_multiplier');
            // E.g., 8.00 = overtime starts after 8 hours/day

            $table->time('overtime_starts_after_time')->nullable()->after('overtime_starts_after_hours');
            // E.g., 18:00 = overtime starts after 6 PM

            $table->boolean('recognizes_overtime')->default(true)->after('overtime_starts_after_time');
            // Whether overtime hours are recognized/paid

            $table->boolean('is_forfait')->default(false)->after('recognizes_overtime');
            // TRUE = fixed rate regardless of hours, FALSE = hourly rate

            // Index for queries
            $table->index('is_forfait');
        });

        // Add forfait field to contractor_rates table
        Schema::table('contractor_rates', function (Blueprint $table) {
            $table->boolean('is_forfait')->default(false)->after('minimum_amount');
            // TRUE = fixed rate, FALSE = per-hour/day/week rate

            $table->index('is_forfait');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workers', function (Blueprint $table) {
            $table->dropColumn('payment_notes');
        });

        Schema::table('worker_rates', function (Blueprint $table) {
            $table->dropIndex(['is_forfait']);
            $table->dropColumn([
                'overtime_starts_after_hours',
                'overtime_starts_after_time',
                'recognizes_overtime',
                'is_forfait',
            ]);
        });

        Schema::table('contractor_rates', function (Blueprint $table) {
            $table->dropIndex(['is_forfait']);
            $table->dropColumn('is_forfait');
        });
    }
};
