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
        Schema::create('contractor_rates', function (Blueprint $table) {
            $table->id();

            // Foreign key
            $table->foreignId('contractor_id')->constrained('contractors')->cascadeOnDelete();

            // Tipo servizio
            $table->string('service_type'); // "operaio generico", "muratore specializzato"
            $table->string('rate_type'); // hourly, daily, monthly, fixed_project

            // Valori tariffari
            $table->decimal('rate_amount', 10, 2);
            $table->string('currency', 3)->default('EUR');

            // Minimo fatturabile
            $table->decimal('minimum_hours', 5, 2)->nullable();
            $table->decimal('minimum_amount', 10, 2)->nullable();

            // Periodo validità
            $table->date('valid_from');
            $table->date('valid_to')->nullable();

            // Note
            $table->text('notes')->nullable();

            // Audit
            $table->timestamps();

            // Indexes
            $table->index('contractor_id');
            $table->index('service_type');
            $table->index('valid_from');
            $table->unique(['contractor_id', 'service_type', 'valid_from'], 'contractor_service_period_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contractor_rates');
    }
};
