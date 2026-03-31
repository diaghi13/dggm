<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'landlord';

    public function up(): void
    {
        Schema::connection('landlord')->table('tenant_subscriptions', function (Blueprint $table) {
            $table->timestamp('trial_ends_at')->nullable()->after('ends_at');
            $table->enum('billing_cycle', ['monthly', 'yearly'])->default('monthly')->after('trial_ends_at');
            $table->timestamp('renews_at')->nullable()->after('billing_cycle');
        });
    }

    public function down(): void
    {
        Schema::connection('landlord')->table('tenant_subscriptions', function (Blueprint $table) {
            $table->dropColumn(['trial_ends_at', 'billing_cycle', 'renews_at']);
        });
    }
};
