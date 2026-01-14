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
        Schema::create('worker_payroll_data', function (Blueprint $table) {
            $table->id();

            // Foreign key 1:1
            $table->foreignId('worker_id')->unique()->constrained('workers')->cascadeOnDelete();

            // Stipendio base
            $table->decimal('gross_monthly_salary', 10, 2);
            $table->decimal('net_monthly_salary', 10, 2)->nullable();

            // Livello contrattuale
            $table->string('contract_level', 50)->nullable(); // "3° livello"
            $table->string('ccnl_type', 100)->nullable(); // "Edilizia Industria"

            // Frequenza pagamento
            $table->string('payroll_frequency', 50); // monthly, biweekly, weekly

            // Contributi e ritenute (percentuali)
            $table->decimal('inps_percentage', 5, 2)->default(9.19);
            $table->decimal('inail_percentage', 5, 2)->default(0.00);
            $table->decimal('irpef_percentage', 5, 2)->nullable();

            // Benefit aziendali
            $table->decimal('meal_voucher_amount', 8, 2)->default(0);
            $table->decimal('transport_allowance', 8, 2)->default(0);

            // Dati bancari per stipendio
            $table->string('iban')->nullable();
            $table->string('bank_name')->nullable();

            // Note payroll
            $table->text('notes')->nullable();

            // Audit
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('worker_payroll_data');
    }
};
