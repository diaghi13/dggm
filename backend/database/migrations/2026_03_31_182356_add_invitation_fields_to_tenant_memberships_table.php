<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'landlord';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::connection('landlord')->table('tenant_memberships', function (Blueprint $table) {
            $table->string('invitation_token')->nullable()->unique()->after('status');
            $table->timestamp('invited_at')->nullable()->after('invitation_token');
            $table->timestamp('expires_at')->nullable()->after('invited_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('landlord')->table('tenant_memberships', function (Blueprint $table) {
            $table->dropUnique(['invitation_token']);
            $table->dropColumn(['invitation_token', 'invited_at', 'expires_at']);
        });
    }
};
