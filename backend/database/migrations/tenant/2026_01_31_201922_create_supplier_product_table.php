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
        Schema::create('supplier_product', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            // Supplier product codes
            $table->string('supplier_product_code', 100)->nullable()->comment('Supplier internal code');
            $table->string('supplier_ean', 13)->nullable();

            // Pricing
            $table->decimal('purchase_price', 10, 2); // Base purchase price
            $table->decimal('wholesale_price', 10, 2)->nullable(); // Price for resellers
            $table->decimal('retail_price', 10, 2)->nullable(); // Suggested retail price

            // Discount family (FK to discount_families or manual discounts)
            $table->foreignId('discount_family_id')->nullable()->constrained('discount_families')->nullOnDelete();

            // Manual cascade discounts (override family discounts if set)
            $table->decimal('manual_discount_1', 5, 2)->nullable()->comment('Override discount 1 %');
            $table->decimal('manual_discount_2', 5, 2)->nullable()->comment('Override discount 2 %');
            $table->decimal('manual_discount_3', 5, 2)->nullable()->comment('Override discount 3 %');

            // Order constraints
            $table->integer('package_quantity')->default(1)->comment('Items per package/box');
            $table->integer('minimum_order_quantity')->default(1);
            $table->integer('maximum_order_quantity')->nullable();
            $table->integer('multiple_order_quantity')->nullable()->comment('Order must be multiple of this');
            $table->integer('lead_time_days')->nullable();

            // Payment terms
            $table->foreignId('payment_term_id')->nullable()->constrained('payment_terms')->nullOnDelete();

            // Additional metadata
            $table->decimal('price_multiplier', 5, 2)->default(1.00);
            $table->string('currency', 3)->default('EUR');
            $table->date('last_price_update')->nullable();
            $table->boolean('is_preferred_supplier')->default(false);
            $table->boolean('is_active')->default(true);

            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes and constraints
            $table->unique(['supplier_id', 'product_id']);
            $table->index('supplier_product_code');
            $table->index('is_preferred_supplier');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_product');
    }
};
