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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key'); // Setting key
            $table->text('value')->nullable(); // Setting value (can be JSON)
            $table->string('type')->default('string'); // string, number, boolean, json
            $table->string('group')->nullable(); // Group for organization (general, email, etc.)
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete(); // null = global
            $table->boolean('is_public')->default(false); // If true, can be read by all users
            $table->text('description')->nullable(); // Optional description
            $table->timestamps();

            // Unique constraint: key must be unique per user (or global if user_id is null)
            $table->unique(['key', 'user_id']);

            // Indexes for performance
            $table->index('group');
            $table->index('is_public');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
