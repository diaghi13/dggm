<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    protected $connection = 'landlord';

    public function up(): void
    {
        // Modify enum to include 'trial' status
        DB::connection('landlord')->statement(
            "ALTER TABLE tenant_subscriptions MODIFY COLUMN status ENUM('pending_payment','trial','active','suspended','cancelled') NOT NULL DEFAULT 'pending_payment'"
        );
    }

    public function down(): void
    {
        // Move any 'trial' rows back to 'pending_payment' before removing the value
        DB::connection('landlord')
            ->table('tenant_subscriptions')
            ->where('status', 'trial')
            ->update(['status' => 'pending_payment']);

        DB::connection('landlord')->statement(
            "ALTER TABLE tenant_subscriptions MODIFY COLUMN status ENUM('pending_payment','active','suspended','cancelled') NOT NULL DEFAULT 'pending_payment'"
        );
    }
};
