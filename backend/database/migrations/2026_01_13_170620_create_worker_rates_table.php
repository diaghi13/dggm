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
        Schema::create('worker_rates', function (Blueprint $table) {
            $table->id();

            // Foreign key
            $table->foreignId('worker_id')->constrained('workers')->cascadeOnDelete();

            // Tipo tariffa
            $table->string('rate_type'); // hourly, daily, weekly, monthly, fixed_project
            $table->string('context'); // internal_cost, customer_billing, payroll

            // Valori tariffari
            $table->decimal('rate_amount', 10, 2);
            $table->string('currency', 3)->default('EUR');

            // Per tariffe a progetto
            $table->string('project_type')->nullable();

            // Tariffe straordinario (opzionale)
            $table->decimal('overtime_multiplier', 4, 2)->default(1.5);
            $table->decimal('holiday_multiplier', 4, 2)->default(2.0);

            // Periodo validità
            $table->date('valid_from');
            $table->date('valid_to')->nullable(); // NULL = tariffa corrente

            // Note
            $table->text('notes')->nullable();

            // Audit
            $table->timestamps();

            // Indexes
            $table->index('worker_id');
            $table->index('rate_type');
            $table->index('context');
            $table->index('valid_from');
            $table->index('valid_to');
            $table->unique(['worker_id', 'context', 'rate_type', 'valid_from'], 'worker_context_period_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('worker_rates');
    }
};
