<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repair_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('inventory_id')->constrained('inventory');
            $table->foreignId('incident_id')->nullable()->constrained('project_material_incidents')->nullOnDelete();
            $table->unsignedBigInteger('inspection_item_id')->nullable();
            $table->enum('repair_type', ['internal', 'external']);
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->decimal('quantity', 10, 2);
            $table->date('sent_date')->nullable();
            $table->date('expected_return_date')->nullable();
            $table->date('actual_return_date')->nullable();
            $table->decimal('repair_cost', 10, 2)->nullable();
            $table->text('repair_notes')->nullable();
            $table->enum('status', ['pending', 'sent_external', 'in_repair', 'completed', 'unrepairable'])->default('pending');
            $table->foreignId('created_by_user_id')->constrained('users');
            $table->foreignId('resolved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'repair_type']);
            $table->index(['product_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_orders');
    }
};
