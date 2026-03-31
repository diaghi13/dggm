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
        Schema::create('sites', function (Blueprint $table) {
            $table->id();

            // Basic Information
            $table->string('code')->unique(); // Site code (e.g., SITE-2024-001)
            $table->string('name'); // Site name/title
            $table->text('description')->nullable();

            // Customer relationship
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');

            // Optional Quote relationship (if converted from quote)
            $table->foreignId('quote_id')->nullable()->constrained()->onDelete('set null');

            // Location
            $table->string('address');
            $table->string('city');
            $table->string('province', 10)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('country')->default('Italy');

            // GPS Coordinates for time tracking validation
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->integer('gps_radius')->default(100); // meters for GPS validation

            // Project Manager
            $table->foreignId('project_manager_id')->nullable()->constrained('users')->onDelete('set null');

            // Financial
            $table->decimal('estimated_amount', 12, 2)->nullable(); // From quote or manual
            $table->decimal('actual_cost', 12, 2)->default(0); // Calculated from expenses
            $table->decimal('invoiced_amount', 12, 2)->default(0); // Sum of invoices

            // Dates
            $table->date('start_date')->nullable();
            $table->date('estimated_end_date')->nullable();
            $table->date('actual_end_date')->nullable();

            // Status: draft, planned, in_progress, on_hold, completed, cancelled
            $table->string('status')->default('draft');

            // Priority: low, medium, high, urgent
            $table->string('priority')->default('medium');

            // Notes
            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable(); // Not visible to customer

            // Tracking
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['status', 'is_active']);
            $table->index('customer_id');
            $table->index('project_manager_id');
            $table->index('start_date');
            $table->index('code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sites');
    }
};
