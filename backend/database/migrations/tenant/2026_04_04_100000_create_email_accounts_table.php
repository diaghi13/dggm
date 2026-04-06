<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('provider')->default('smtp'); // smtp | gmail | outlook | ses | mailgun
            $table->string('from_email');
            $table->string('from_name');
            // SMTP
            $table->string('smtp_host')->nullable();
            $table->unsignedSmallInteger('smtp_port')->nullable();
            $table->string('smtp_encryption')->nullable(); // tls | ssl | null
            $table->string('smtp_username')->nullable();
            $table->text('smtp_password')->nullable(); // encrypted
            // OAuth
            $table->text('oauth_access_token')->nullable();  // encrypted
            $table->text('oauth_refresh_token')->nullable(); // encrypted
            $table->timestamp('oauth_token_expires_at')->nullable();
            // Firma email
            $table->text('signature')->nullable();
            $table->text('signature_plain')->nullable();
            // Stato
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->timestamp('last_tested_at')->nullable();
            $table->boolean('last_test_success')->nullable();
            $table->text('last_test_error')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_accounts');
    }
};
