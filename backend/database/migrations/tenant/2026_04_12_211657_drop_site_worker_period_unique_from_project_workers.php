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
        Schema::table('project_workers', function (Blueprint $table) {
            $table->dropUnique('site_worker_period_unique');
        });
    }

    public function down(): void
    {
        Schema::table('project_workers', function (Blueprint $table) {
            $table->unique(['project_id', 'worker_id', 'assigned_from'], 'site_worker_period_unique');
        });
    }
};
