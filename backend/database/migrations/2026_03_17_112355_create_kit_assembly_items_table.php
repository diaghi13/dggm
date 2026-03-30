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
        Schema::create('kit_assembly_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kit_assembly_id')->constrained('kit_assemblies')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->decimal('quantity', 10, 2)->default(1);
            $table->string('serial_number', 100)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('kit_assembly_id');
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kit_assembly_items');
    }
};
