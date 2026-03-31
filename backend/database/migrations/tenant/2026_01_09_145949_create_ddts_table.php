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
        Schema::create('ddts', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique(); // DDT-2026-001
            $table->enum('type', ['incoming', 'outgoing', 'internal', 'rental_out', 'rental_return', 'return_from_customer', 'return_to_supplier']);

            // Riferimenti
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('site_id')->nullable()->constrained('sites')->nullOnDelete();
            $table->foreignId('from_warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignId('to_warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();

            // Dati DDT
            $table->string('ddt_number', 100); // Numero DDT (fornitore o nostro)
            $table->date('ddt_date');
            $table->dateTime('transport_date')->nullable();
            $table->string('carrier_name')->nullable(); // Vettore
            $table->string('tracking_number', 100)->nullable();

            // Documenti allegati (gestiti da Spatie MediaLibrary)
            // $table->string('file_path', 500)->nullable(); // Non serve, usiamo MediaLibrary

            // Noleggio (rental)
            $table->date('rental_start_date')->nullable(); // Data inizio noleggio
            $table->date('rental_end_date')->nullable(); // Data fine prevista noleggio
            $table->date('rental_actual_return_date')->nullable(); // Data effettiva restituzione
            $table->foreignId('parent_ddt_id')->nullable()->constrained('ddts')->nullOnDelete(); // DDT di origine per rental_return/resi

            // Resi (returns)
            $table->enum('return_reason', ['defective', 'wrong_item', 'excess', 'warranty', 'customer_dissatisfaction', 'other'])->nullable();
            $table->text('return_notes')->nullable();

            // Status
            $table->enum('status', ['draft', 'issued', 'in_transit', 'delivered', 'cancelled'])->default('draft');
            $table->text('notes')->nullable();

            // Audit
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('code');
            $table->index('type');
            $table->index('status');
            $table->index('ddt_date');
            $table->index(['from_warehouse_id', 'ddt_date']);
            $table->index(['site_id', 'ddt_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ddts');
    }
};
