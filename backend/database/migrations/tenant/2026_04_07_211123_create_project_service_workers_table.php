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
        Schema::create('project_service_workers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_service_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_worker_id')->constrained('project_workers')->cascadeOnDelete();
            $table->decimal('assigned_hours', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['project_service_id', 'project_worker_id'], 'psw_service_worker_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_service_workers');
    }
};
