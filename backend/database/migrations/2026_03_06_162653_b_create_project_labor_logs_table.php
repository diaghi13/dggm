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
        Schema::create('project_labor_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('project_worker_id')->constrained('project_workers')->cascadeOnDelete();

            // Denormalized for easier querying
            $table->foreignId('worker_id')->nullable()->constrained('workers')->nullOnDelete();

            // Link to the planned schedule day (event-type projects with work schedule)
            $table->foreignId('schedule_day_id')
                ->nullable()
                ->references('id')->on('project_worker_schedules')
                ->nullOnDelete();

            $table->date('log_date');
            $table->decimal('regular_hours', 5, 2)->default(0);
            $table->decimal('overtime_hours', 5, 2)->default(0);
            $table->text('description')->nullable();

            $table->foreignId('submitted_by_user_id')->constrained('users');

            // PM approval workflow — Values: pending | approved | rejected
            $table->string('status')->default('pending');
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();

            // Set on approval — links to the auto-generated ProjectLaborCost
            $table->foreignId('labor_cost_id')
                ->nullable()
                ->references('id')->on('project_labor_costs')
                ->nullOnDelete();

            $table->timestamps();

            $table->unique(['project_worker_id', 'log_date'], 'pll_worker_date_unique');
            $table->index('project_id');
            $table->index('log_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_labor_logs');
    }
};
