<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_material_incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_material_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reported_by_user_id')->constrained('users');
            $table->enum('incident_type', ['missing', 'broken', 'damaged', 'contaminated', 'lost_by_client', 'stolen']);
            $table->enum('damage_severity', ['minor', 'major', 'write_off'])->nullable();
            $table->text('description');
            $table->date('incident_date');
            $table->boolean('is_chargeable_to_client')->default(false);
            $table->decimal('charge_amount', 10, 2)->nullable();
            $table->text('charge_basis')->nullable();
            $table->enum('status', ['open', 'reviewed', 'resolved', 'invoiced'])->default('open');
            $table->text('resolution_notes')->nullable();
            $table->foreignId('resolved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('ddt_item_id')->nullable()->constrained('ddt_items')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['project_id', 'status']);
            $table->index(['project_material_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_material_incidents');
    }
};
