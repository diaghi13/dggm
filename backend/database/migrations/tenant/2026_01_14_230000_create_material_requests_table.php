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
        Schema::create('material_requests', function (Blueprint $table) {
            $table->id();

            // Relationships
            $table->foreignId('site_id')->constrained('sites')->cascadeOnDelete();
            $table->foreignId('material_id')->constrained('materials')->cascadeOnDelete();
            $table->foreignId('requested_by_worker_id')->constrained('workers')->cascadeOnDelete();
            $table->foreignId('requested_by_user_id')->constrained('users')->cascadeOnDelete();

            // Request details
            $table->decimal('quantity_requested', 10, 2);
            $table->string('unit_of_measure')->nullable();
            $table->string('status')->default('pending'); // pending, approved, rejected, delivered
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->text('reason')->nullable(); // Why the material is needed
            $table->text('notes')->nullable(); // Additional notes from worker
            $table->date('needed_by')->nullable(); // When the material is needed

            // Response details
            $table->foreignId('responded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('responded_at')->nullable();
            $table->text('response_notes')->nullable(); // PM/Admin notes
            $table->text('rejection_reason')->nullable();

            // Approval details
            $table->decimal('quantity_approved', 10, 2)->nullable();
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();

            // Delivery details
            $table->decimal('quantity_delivered', 10, 2)->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->foreignId('delivered_by_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('priority');
            $table->index(['site_id', 'status']);
            $table->index(['requested_by_worker_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('material_requests');
    }
};
