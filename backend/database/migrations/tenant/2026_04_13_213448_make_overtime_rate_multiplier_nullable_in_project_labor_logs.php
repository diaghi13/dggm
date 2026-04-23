<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE project_labor_logs MODIFY COLUMN overtime_rate_multiplier DECIMAL(4,2) NULL DEFAULT NULL');
    }

    public function down(): void
    {
        DB::statement('UPDATE project_labor_logs SET overtime_rate_multiplier = 1.00 WHERE overtime_rate_multiplier IS NULL');
        DB::statement('ALTER TABLE project_labor_logs MODIFY COLUMN overtime_rate_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00');
    }
};
