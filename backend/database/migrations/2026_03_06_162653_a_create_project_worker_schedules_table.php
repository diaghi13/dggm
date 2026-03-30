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
        Schema::create('project_worker_schedules', function (Blueprint $table) {
            $table->id();

            $table->foreignId('project_worker_id')
                ->constrained('project_workers')
                ->cascadeOnDelete();

            $table->date('scheduled_date');
            $table->time('planned_start_time')->nullable();
            $table->time('planned_end_time')->nullable();
            // Computed from start/end or set manually
            $table->decimal('planned_hours', 5, 2)->nullable();

            // Per-day worker acceptance
            // Behavior controlled by setting: project.schedule_change_behavior
            // Values: pending | accepted | rejected
            $table->string('status')->default('pending');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->unique(['project_worker_id', 'scheduled_date'], 'pws_worker_date_unique');
            $table->index('scheduled_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_worker_schedules');
    }
};
