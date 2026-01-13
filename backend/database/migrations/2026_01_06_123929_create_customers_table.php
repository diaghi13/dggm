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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('type')->default('individual'); // individual, company

            // Individual customer fields
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();

            // Company customer fields
            $table->string('company_name')->nullable();
            $table->string('vat_number')->nullable()->unique();
            $table->string('tax_code')->nullable();

            // Common fields
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('mobile')->nullable();

            // Address
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('province', 2)->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->default('IT');

            // Billing info
            $table->string('payment_terms')->default('30'); // days
            $table->decimal('discount_percentage', 5, 2)->default(0);

            // Additional info
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['type', 'is_active']);
            $table->index('email');
            $table->index('company_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
