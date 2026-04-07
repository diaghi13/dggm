<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_error_logs', function (Blueprint $table) {
            $table->id();
            $table->string('exception_class', 255);
            $table->text('message');
            $table->text('stack_trace')->nullable();
            $table->string('severity', 20)->default('error'); // error | warning | critical
            $table->string('url', 500)->nullable();
            $table->string('method', 10)->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('context')->nullable(); // extra data (request params sanitized)
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index('severity');
            $table->index('occurred_at');
            $table->index('exception_class');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_error_logs');
    }
};
