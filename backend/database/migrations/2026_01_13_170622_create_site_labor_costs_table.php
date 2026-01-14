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
        Schema::create('site_labor_costs', function (Blueprint $table) {
            $table->id();

            // Foreign key cantiere
            $table->foreignId('site_id')->constrained('sites')->cascadeOnDelete();

            // Tipo costo
            $table->string('cost_type'); // internal_labor, subcontractor, contractor

            // Foreign keys opzionali (dipende dal tipo)
            $table->foreignId('worker_id')->nullable()->constrained('workers')->nullOnDelete();
            $table->foreignId('contractor_id')->nullable()->constrained('contractors')->nullOnDelete();

            // Link a future time tracking (fase 2) - FK verrà aggiunto quando time_entries esiste
            $table->unsignedBigInteger('time_entry_id')->nullable()->index();

            // Descrizione lavoro
            $table->text('description')->nullable();

            // Data lavoro
            $table->date('work_date');

            // Quantità e tariffe
            $table->decimal('hours_worked', 8, 2)->nullable(); // Per manodopera oraria
            $table->decimal('quantity', 10, 2)->default(1); // Per altre unità di misura
            $table->decimal('unit_rate', 10, 2); // Tariffa unitaria
            $table->decimal('total_cost', 10, 2); // Costo totale calcolato
            $table->string('currency', 3)->default('EUR');

            // Flags speciali
            $table->boolean('is_overtime')->default(false);
            $table->boolean('is_holiday')->default(false);

            // Categorizzazione
            $table->string('cost_category')->nullable(); // "muratura", "impianti", "finiture"

            // Dati fatturazione (per contractor/subcontractor)
            $table->string('invoice_number')->nullable();
            $table->date('invoice_date')->nullable();
            $table->boolean('is_invoiced')->default(false);

            // Note
            $table->text('notes')->nullable();

            // Audit
            $table->timestamps();

            // Indexes
            $table->index('site_id');
            $table->index('cost_type');
            $table->index('worker_id');
            $table->index('contractor_id');
            $table->index('work_date');
            $table->index('is_invoiced');
            $table->index(['site_id', 'work_date'], 'site_date_idx');
            $table->index(['worker_id', 'work_date'], 'worker_date_idx');
            $table->index(['contractor_id', 'is_invoiced'], 'contractor_invoice_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_labor_costs');
    }
};
