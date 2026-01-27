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
        Schema::create('product_relations', function (Blueprint $table) {
            $table->id();

            // Main product
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');

            // Related product
            $table->foreignId('related_product_id')->constrained('products')->onDelete('cascade');

            // Relation type (configurable via table)
            $table->foreignId('relation_type_id')->constrained('product_relation_types')->onDelete('restrict');

            // Quantity calculation (ENUM backend)
            $table->enum('quantity_type', ['fixed', 'multiplied', 'formula'])
                ->default('fixed')
                ->comment('Quantity calculation type');
            $table->string('quantity_value')->default('1')
                ->comment('Numeric value or formula (e.g., "2", "0.5", "ceil(qty/6)")');

            // Behavior in 3 LISTS
            $table->boolean('is_visible_in_quote')->default(false)
                ->comment('LIST 1: Show in customer quote');
            $table->boolean('is_visible_in_material_list')->default(true)
                ->comment('LIST 2: Show in site material list');
            $table->boolean('is_required_for_stock')->default(true)
                ->comment('LIST 3: Required for stock load/unload');

            // Other behaviors
            $table->boolean('is_optional')->default(false)
                ->comment('If TRUE, user must confirm inclusion of related product');

            // Conditional triggers (when to apply the relation)
            $table->decimal('min_quantity_trigger', 10, 2)->nullable()
                ->comment('Apply only if qty >= X');
            $table->decimal('max_quantity_trigger', 10, 2)->nullable()
                ->comment('Apply only if qty <= X');

            // Sorting priority
            $table->integer('sort_order')->default(0);

            // Notes
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->unique(['product_id', 'related_product_id', 'relation_type_id'], 'unique_relation');
            $table->index('product_id');
            $table->index('related_product_id');
            $table->index('relation_type_id');
            $table->index('quantity_type');
            $table->index('is_visible_in_quote');
            $table->index('is_visible_in_material_list');
            $table->index('is_required_for_stock');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_relations');
    }
};
