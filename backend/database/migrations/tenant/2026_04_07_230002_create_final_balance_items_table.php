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
        Schema::create('final_balance_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('final_balance_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('final_balance_items')->nullOnDelete();
            $table->foreignId('quote_item_id')->nullable()->constrained('quote_items')->nullOnDelete();
            $table->foreignId('project_material_id')->nullable()->constrained('project_materials')->nullOnDelete();
            $table->foreignId('project_service_id')->nullable()->constrained('project_services')->nullOnDelete();
            $table->foreignId('project_expense_id')->nullable()->constrained('project_expenses')->nullOnDelete();
            $table->foreignId('incident_id')->nullable()->constrained('project_material_incidents')->nullOnDelete();
            $table->enum('type', ['section', 'material', 'labor', 'expense', 'service', 'damage', 'transport', 'quote_reference', 'other']);
            $table->text('description');
            $table->string('code', 100)->nullable();
            $table->string('unit', 50)->nullable();
            $table->decimal('quantity', 10, 2)->default(1);
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->decimal('cost_price', 10, 2)->nullable();
            $table->decimal('discount_percentage', 5, 2)->default(0);
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->boolean('is_manual')->default(false);
            $table->integer('sort_order')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['final_balance_id', 'sort_order']);
            $table->index('parent_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('final_balance_items');
    }
};
