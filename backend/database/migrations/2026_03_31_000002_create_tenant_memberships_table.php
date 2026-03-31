<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'landlord';

    public function up(): void
    {
        Schema::connection('landlord')->create('tenant_memberships', function (Blueprint $table) {
            $table->id();
            $table->uuid('global_user_id');
            $table->string('tenant_id');
            $table->string('role')->default('admin');
            $table->enum('status', ['active', 'invited', 'suspended'])->default('invited');
            $table->timestamps();

            $table->foreign('global_user_id')->references('id')->on('global_users')->cascadeOnDelete();
            $table->unique(['global_user_id', 'tenant_id']);
        });
    }

    public function down(): void
    {
        Schema::connection('landlord')->dropIfExists('tenant_memberships');
    }
};
