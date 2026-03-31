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
        Schema::create('project_expenses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();

            // Nullable: project-level (PM adds hotel/transport) OR worker-level (worker adds fuel)
            // When set: enables cost attribution per resource in analysis
            $table->foreignId('project_worker_id')
                ->nullable()
                ->constrained('project_workers')
                ->nullOnDelete();

            $table->foreignId('submitted_by_user_id')->constrained('users');

            // Values: fuel | food | accommodation | transport | tools | other
            $table->string('category');
            $table->string('description');
            $table->decimal('amount', 10, 2);
            $table->date('expense_date');

            // If true: included in Final Balance billed to client
            $table->boolean('is_billable_to_client')->default(false);

            // Receipt photo (soft reference to media table)
            $table->unsignedBigInteger('receipt_media_id')->nullable();

            // PM approval workflow — Values: pending | approved | rejected
            // Auto-approved if amount <= project.expense_auto_approve_threshold setting
            $table->string('status')->default('pending');
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index('project_id');
            $table->index('status');
            $table->index('is_billable_to_client');
            $table->index('expense_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_expenses');
    }
};
