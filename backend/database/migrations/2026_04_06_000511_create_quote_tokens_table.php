<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'landlord';

    public function up(): void
    {
        Schema::connection('landlord')->create('quote_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('token', 36)->unique(); // UUID
            $table->string('tenant_id');
            $table->unsignedBigInteger('quote_id');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index('token');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::connection('landlord')->dropIfExists('quote_tokens');
    }
};
