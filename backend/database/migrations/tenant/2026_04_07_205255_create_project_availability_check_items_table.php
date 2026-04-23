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
        Schema::create('project_availability_check_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('check_id')->constrained('project_availability_checks')->cascadeOnDelete();
            $table->foreignId('project_material_id')->constrained()->cascadeOnDelete();
            $table->decimal('planned_qty', 10, 2);
            $table->decimal('available_qty', 10, 2)->default(0);
            $table->decimal('reserved_qty', 10, 2)->default(0);
            $table->decimal('shortage_qty', 10, 2)->default(0);
            $table->enum('availability_status', ['available', 'partial', 'unavailable']);
            $table->enum('resolution', ['none', 'reserve_existing', 'subrental', 'remove_from_project'])->default('none');
            $table->foreignId('subrental_supplier_id')->nullable()->constrained('product_subrental_suppliers')->nullOnDelete();
            $table->decimal('subrental_estimated_cost', 10, 2)->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_availability_check_items');
    }
};
