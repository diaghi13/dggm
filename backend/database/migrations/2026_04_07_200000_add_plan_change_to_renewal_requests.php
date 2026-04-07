<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'landlord';

    public function up(): void
    {
        // Alter the type enum to add upgrade and downgrade
        DB::connection('landlord')->statement(
            "ALTER TABLE renewal_requests MODIFY COLUMN type ENUM('renewal', 'addon_add', 'renewal_with_addons', 'upgrade', 'downgrade') NOT NULL"
        );

        Schema::connection('landlord')->table('renewal_requests', function (Blueprint $table) {
            $table->unsignedBigInteger('target_plan_id')->nullable()->after('addons');
        });
    }

    public function down(): void
    {
        Schema::connection('landlord')->table('renewal_requests', function (Blueprint $table) {
            $table->dropColumn('target_plan_id');
        });

        DB::connection('landlord')->statement(
            "ALTER TABLE renewal_requests MODIFY COLUMN type ENUM('renewal', 'addon_add', 'renewal_with_addons') NOT NULL"
        );
    }
};
