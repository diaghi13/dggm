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
        Schema::create('site_worker_role', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_worker_id')->constrained('site_workers')->cascadeOnDelete();
            $table->foreignId('site_role_id')->constrained('site_roles')->cascadeOnDelete();
            $table->timestamps();

            // Indexes
            $table->index('site_worker_id');
            $table->index('site_role_id');

            // Un ruolo può essere assegnato una sola volta per ogni site_worker
            $table->unique(['site_worker_id', 'site_role_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_worker_role');
    }
};
