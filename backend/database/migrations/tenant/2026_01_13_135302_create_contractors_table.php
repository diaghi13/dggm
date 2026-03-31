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
        Schema::create('contractors', function (Blueprint $table) {
            $table->id();

            // Identificazione
            $table->string('code')->unique(); // CTR-00001
            $table->string('company_name');

            // Dati fiscali
            $table->string('vat_number')->unique();
            $table->string('tax_code')->nullable();

            // Tipo cooperativa
            $table->string('contractor_type'); // cooperative, subcontractor, temporary_agency

            // Contatti
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('website')->nullable();

            // Indirizzo sede legale
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('province', 2)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('country', 2)->default('IT');

            // Referente aziendale
            $table->string('contact_person')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();

            // Dati bancari
            $table->string('iban')->nullable();
            $table->string('bank_name')->nullable();

            // Termini commerciali
            $table->string('payment_terms', 50)->default('30'); // giorni

            // Specializzazioni aziendali
            $table->json('specializations')->nullable(); // ["scaffolding", "concrete"]

            // Note
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);

            // Audit
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('company_name');
            $table->index('vat_number');
            $table->index('contractor_type');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contractors');
    }
};
