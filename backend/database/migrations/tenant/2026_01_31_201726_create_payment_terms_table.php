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
        Schema::create('payment_terms', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique(); // 'NET30', 'NET60', 'RIBA60', 'CASH'
            $table->string('name'); // 'Netto 30gg fm', '60gg dfm', 'Ri.Ba. 60gg'
            $table->text('description')->nullable();
            $table->integer('days')->default(0); // Payment days (30, 60, 90...)
            $table->enum('payment_type', ['bank_transfer', 'riba', 'cash', 'credit_card', 'check', 'other'])->default('bank_transfer');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('code');
            $table->index('is_default');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_terms');
    }
};
