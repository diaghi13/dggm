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
        Schema::create('discount_families', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->string('code', 50); // 'COM1', 'COM2', 'PREM', 'PROMO'
            $table->string('name'); // 'Componentistica Standard', 'Premium'
            $table->text('description')->nullable();

            // Cascade discount percentages (10% + 10% + 5%)
            $table->decimal('discount_1', 5, 2)->default(0)->comment('First discount %');
            $table->decimal('discount_2', 5, 2)->default(0)->comment('Second discount %');
            $table->decimal('discount_3', 5, 2)->default(0)->comment('Third discount %');

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['supplier_id', 'code']);
            $table->index('code');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discount_families');
    }
};
