<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Create price_lists table for managing multiple price lists
     * with automatic or manual pricing modes.
     */
    public function up(): void
    {
        Schema::create('price_lists', function (Blueprint $table) {
            $table->id();

            // Basic info
            $table->string('name', 100)
                ->comment('Base, Promo 2026, Black Friday');

            $table->string('code', 50)->unique();
            $table->text('description')->nullable();

            // Calculation mode
            $table->enum('calculation_mode', ['automatic', 'manual'])
                ->default('automatic');

            // Adjustment (for automatic mode)
            $table->enum('adjustment_type', ['percentage', 'fixed', 'none'])
                ->default('percentage');

            $table->decimal('adjustment_value', 10, 2)
                ->nullable()
                ->comment('10 = +10% or +10€');

            // Application scope
            $table->enum('applies_to', ['sale', 'rental', 'both'])
                ->default('sale');

            // Filters
            $table->foreignId('category_id')
                ->nullable()
                ->constrained('product_categories')
                ->nullOnDelete();

            $table->string('department_filter', 50)->nullable();

            // Validity
            $table->date('valid_from')->nullable();
            $table->date('valid_to')->nullable();

            // Status
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->integer('priority')->default(0);

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['is_active', 'is_default']);
            $table->index(['valid_from', 'valid_to']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('price_lists');
    }
};
