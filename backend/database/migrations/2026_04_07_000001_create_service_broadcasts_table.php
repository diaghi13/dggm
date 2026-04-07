<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('landlord')->create('service_broadcasts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('info'); // info|success|warning|announcement
            $table->json('target_roles')->nullable(); // null = all users, array of role names = filtered
            $table->string('created_by_global_user_id')->nullable(); // uuid of the GlobalUser who created it
            $table->string('status')->default('pending'); // pending|dispatched|failed
            $table->timestamp('dispatched_at')->nullable();
            $table->integer('tenant_count')->default(0);
            $table->integer('user_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('landlord')->dropIfExists('service_broadcasts');
    }
};
