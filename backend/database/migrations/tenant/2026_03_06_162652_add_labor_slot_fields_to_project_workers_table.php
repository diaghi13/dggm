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
        Schema::table('project_workers', function (Blueprint $table) {
            // Make worker_id nullable to support "slots":
            // a role placeholder created from quote labor items before a specific worker is assigned.
            // MySQL unique indexes allow multiple NULLs, so existing unique constraint stays valid.
            $table->unsignedBigInteger('worker_id')->nullable()->change();

            // Make assigned_from nullable for unassigned slots (no start date yet)
            $table->date('assigned_from')->nullable()->change();

            // Role label copied from quote item description (e.g. "Fonico", "Tecnico Audio")
            if (! Schema::hasColumn('project_workers', 'role_name')) {
                $table->string('role_name')->nullable()->after('site_role');
            }

            // Index within a group of identical roles from the same quote item.
            // e.g. Facchino qty=2 → slot_index 1 and 2
            if (! Schema::hasColumn('project_workers', 'slot_index')) {
                $table->unsignedTinyInteger('slot_index')->default(1)->after('role_name');
            }

            // Link back to the originating quote item (for traceability)
            if (! Schema::hasColumn('project_workers', 'quote_item_id')) {
                $table->foreignId('quote_item_id')
                    ->nullable()
                    ->after('slot_index')
                    ->constrained('quote_items')
                    ->nullOnDelete();
            }

            // Budget estimate pulled from quote at conversion time
            if (! Schema::hasColumn('project_workers', 'estimated_days')) {
                $table->decimal('estimated_days', 8, 2)->nullable()->after('estimated_hours');
            }

            if (! Schema::hasColumn('project_workers', 'budget_cost_rate')) {
                $table->decimal('budget_cost_rate', 10, 2)->nullable()->after('estimated_days');
            }

            // Real cost rate: pulled from WorkerRate when worker is assigned
            if (! Schema::hasColumn('project_workers', 'actual_cost_rate')) {
                $table->decimal('actual_cost_rate', 10, 2)->nullable()->after('budget_cost_rate');
            }

            // Customer-facing rate for computing extra-hour revenue in Final Balance
            if (! Schema::hasColumn('project_workers', 'customer_rate')) {
                $table->decimal('customer_rate', 10, 2)->nullable()->after('actual_cost_rate');
            }

            // true  = external (freelancer/collaborator) → uses actual_cost_rate from WorkerRate
            // false = internal (employee) → uses monthly_salary / hours_per_month setting
            if (! Schema::hasColumn('project_workers', 'is_external')) {
                $table->boolean('is_external')->default(false)->after('customer_rate');
            }

            // true  = event mode: worker has scheduled days (ProjectWorkerSchedule)
            // false = cantiere mode: worker clocks in freely
            if (! Schema::hasColumn('project_workers', 'is_scheduled')) {
                $table->boolean('is_scheduled')->default(false)->after('is_external');
            }
        });
    }

    public function down(): void
    {
        Schema::table('project_workers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('quote_item_id');
            $table->dropColumn([
                'role_name', 'slot_index',
                'estimated_days', 'budget_cost_rate', 'actual_cost_rate', 'customer_rate',
                'is_external', 'is_scheduled',
            ]);
            $table->unsignedBigInteger('worker_id')->nullable(false)->change();
            $table->date('assigned_from')->nullable(false)->change();
        });
    }
};
