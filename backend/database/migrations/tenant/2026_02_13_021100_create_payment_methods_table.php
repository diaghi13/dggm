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
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();

            // Basic info
            $table->enum('type', ['bank_account', 'cash', 'card'])->index();
            $table->string('name'); // Display name (e.g., "Conto Corrente Principale")
            $table->text('description')->nullable();

            // Details (JSON) - flexible for different types
            // Bank: iban, swift, bank_name, account_holder, branch
            // Cash: location
            // Card: card_type, last_digits, provider
            $table->json('details')->nullable();

            // Status & ordering
            $table->boolean('is_active')->default(true)->index();
            $table->boolean('is_default')->default(false)->index(); // One default per type
            $table->integer('sort_order')->default(0);

            // Notes
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['type', 'is_active']);
            $table->index(['type', 'is_default']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
