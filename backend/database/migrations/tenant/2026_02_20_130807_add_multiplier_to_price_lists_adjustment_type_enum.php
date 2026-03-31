<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // MySQL/MariaDB: ALTER ENUM column to add 'multiplier'
        // SQLite does not support MODIFY COLUMN — skip silently (test environment)
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE price_lists MODIFY COLUMN adjustment_type ENUM('percentage', 'fixed', 'none', 'multiplier') NOT NULL DEFAULT 'percentage'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE price_lists MODIFY COLUMN adjustment_type ENUM('percentage', 'fixed', 'none') NOT NULL DEFAULT 'percentage'");
        }
    }
};
