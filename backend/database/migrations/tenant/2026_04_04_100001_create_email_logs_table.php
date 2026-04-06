<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('email_account_id')->nullable()->constrained()->nullOnDelete();
            $table->string('document_type')->nullable(); // quote | invoice | ddt | sal | invitation | generic
            $table->unsignedBigInteger('document_id')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('to_email');
            $table->string('to_name')->nullable();
            $table->string('subject');
            $table->string('status')->default('pending'); // pending | sent | failed | retrying
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['document_type', 'document_id']);
            $table->index('status');
            $table->index('to_email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_logs');
    }
};
