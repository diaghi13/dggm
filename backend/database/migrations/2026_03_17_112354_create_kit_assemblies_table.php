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
        Schema::create('kit_assemblies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('name');
            $table->string('status')->default('assembled');
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('assembled_at')->nullable();
            $table->timestamp('disassembled_at')->nullable();
            $table->foreignId('assembled_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('disassembled_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('product_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kit_assemblies');
    }
};
