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
        Schema::create('workers', function (Blueprint $table) {
            $table->id();

            // Identificazione
            $table->string('code')->unique(); // WRK-00001
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            // Tipo collaboratore
            $table->string('worker_type'); // employee, freelancer, contractor_company
            $table->string('contract_type'); // permanent, fixed_term, seasonal, project_based, internship

            // Dati anagrafici
            $table->string('first_name');
            $table->string('last_name');
            $table->string('tax_code')->unique()->nullable(); // Codice fiscale
            $table->string('vat_number')->unique()->nullable(); // P.IVA
            $table->date('birth_date')->nullable();
            $table->string('birth_place')->nullable();

            // Contatti
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('mobile')->nullable();

            // Indirizzo residenza
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('province', 2)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('country', 2)->default('IT');

            // Relazione con cooperativa
            $table->foreignId('contractor_company_id')->nullable()
                ->constrained('contractors')->restrictOnDelete();

            // Dati contrattuali
            $table->date('hire_date')->nullable();
            $table->date('termination_date')->nullable();
            $table->date('contract_end_date')->nullable();

            // Qualifica e ruolo operativo
            $table->string('job_title')->nullable(); // "Muratore", "Elettricista"
            $table->string('job_level')->nullable(); // junior, senior, specialist, supervisor
            $table->json('specializations')->nullable(); // ["carpentry", "electrical"]
            $table->json('certifications')->nullable(); // [{"name": "Ponteggi", "expires": "2026-12-31"}]

            // Stato e flags
            $table->boolean('is_active')->default(true);
            $table->boolean('can_drive_company_vehicles')->default(false);
            $table->boolean('has_safety_training')->default(false);
            $table->date('safety_training_expires_at')->nullable();

            // Note
            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable(); // Note riservate

            // Audit
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('worker_type');
            $table->index('contract_type');
            $table->index('is_active');
            $table->index('user_id');
            $table->index('contractor_company_id');
            $table->index('code');
            $table->index('tax_code');
            $table->index('hire_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workers');
    }
};
