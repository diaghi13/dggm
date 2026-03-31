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
        Schema::create('site_roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Nome ruolo: "Caposquadra", "Operaio", etc.
            $table->string('slug')->unique(); // Slug per identificazione: "caposquadra", "operaio"
            $table->text('description')->nullable(); // Descrizione del ruolo
            $table->string('color')->nullable(); // Colore hex per UI (#FF5733)
            $table->integer('sort_order')->default(0); // Ordinamento per lista
            $table->boolean('is_active')->default(true); // Ruolo attivo/disattivo
            $table->timestamps();

            // Indexes
            $table->index('is_active');
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_roles');
    }
};
