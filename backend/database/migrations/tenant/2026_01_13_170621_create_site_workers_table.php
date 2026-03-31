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
        Schema::create('site_workers', function (Blueprint $table) {
            $table->id();

            // Foreign keys
            $table->foreignId('site_id')->constrained('sites')->cascadeOnDelete();
            $table->foreignId('worker_id')->constrained('workers')->cascadeOnDelete();

            // Ruolo nel cantiere
            $table->string('site_role')->nullable(); // "Caposquadra", "Operaio", "Specializzato"

            // Periodo di assegnazione
            $table->date('assigned_from');
            $table->date('assigned_to')->nullable(); // NULL = ancora assegnato

            // Override tariffa specifica per questo cantiere
            $table->decimal('hourly_rate_override', 10, 2)->nullable();

            // Stima ore previste
            $table->decimal('estimated_hours', 8, 2)->nullable();

            // Stato
            $table->boolean('is_active')->default(true);

            // Note
            $table->text('notes')->nullable();

            // Audit
            $table->timestamps();

            // Indexes
            $table->index('site_id');
            $table->index('worker_id');
            $table->index('is_active');
            $table->index('assigned_from');
            $table->index('assigned_to');

            // Constraint: un worker non può essere assegnato due volte allo stesso cantiere nello stesso periodo
            $table->unique(['site_id', 'worker_id', 'assigned_from'], 'site_worker_period_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_workers');
    }
};
