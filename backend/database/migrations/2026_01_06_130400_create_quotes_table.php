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
        Schema::create('quotes', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('project_manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('description')->nullable();

            // Address (can differ from customer address)
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('province')->nullable();
            $table->string('postal_code')->nullable();

            // Status: draft, sent, approved, rejected, expired, converted
            $table->enum('status', ['draft', 'sent', 'approved', 'rejected', 'expired', 'converted'])->default('draft');

            // Dates
            $table->date('issue_date');
            $table->date('expiry_date')->nullable();
            $table->date('sent_date')->nullable();
            $table->date('approved_date')->nullable();

            // Amounts (calculated from items)
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount_percentage', 5, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('tax_percentage', 5, 2)->default(22); // IVA 22%
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);

            $table->text('notes')->nullable();
            $table->text('terms_and_conditions')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('code');
            $table->index('customer_id');
            $table->index('status');
            $table->index('issue_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotes');
    }
};
