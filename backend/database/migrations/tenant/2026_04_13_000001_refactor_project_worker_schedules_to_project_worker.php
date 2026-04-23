<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add nullable project_id and worker_id (skip if already present)
        Schema::table('project_worker_schedules', function (Blueprint $table) {
            if (! Schema::hasColumn('project_worker_schedules', 'project_id')) {
                $table->unsignedBigInteger('project_id')->nullable()->after('id');
            }
            if (! Schema::hasColumn('project_worker_schedules', 'worker_id')) {
                $table->unsignedBigInteger('worker_id')->nullable()->after('project_id');
            }
        });

        // 2. Backfill from project_workers (only when project_worker_id still exists)
        if (Schema::hasColumn('project_worker_schedules', 'project_worker_id')) {
            DB::statement('
                UPDATE project_worker_schedules pws
                JOIN project_workers pw ON pw.id = pws.project_worker_id
                SET pws.project_id = pw.project_id, pws.worker_id = pw.worker_id
                WHERE pws.project_id IS NULL OR pws.worker_id IS NULL
            ');

            // 3. Delete orphaned schedules that couldn't be backfilled
            DB::statement('DELETE FROM project_worker_schedules WHERE project_id IS NULL OR worker_id IS NULL');
        }

        // 4. Make NOT NULL via raw SQL (->change() requires Doctrine, removed in Laravel 12)
        $columns = collect(DB::select('SHOW COLUMNS FROM project_worker_schedules'))
            ->keyBy('Field');

        if (($columns->get('project_id')?->Null ?? 'NO') === 'YES') {
            DB::statement('ALTER TABLE project_worker_schedules MODIFY COLUMN project_id BIGINT UNSIGNED NOT NULL');
        }
        if (($columns->get('worker_id')?->Null ?? 'NO') === 'YES') {
            DB::statement('ALTER TABLE project_worker_schedules MODIFY COLUMN worker_id BIGINT UNSIGNED NOT NULL');
        }

        // 5. Drop old FK on project_worker_id (must happen before dropping the index it covers)
        $existingFks = collect(DB::select("
            SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'project_worker_schedules'
              AND REFERENCED_TABLE_NAME IS NOT NULL
              AND COLUMN_NAME = 'project_worker_id'
        "))->pluck('CONSTRAINT_NAME')->toArray();

        foreach ($existingFks as $fkName) {
            DB::statement("ALTER TABLE project_worker_schedules DROP FOREIGN KEY `{$fkName}`");
        }

        // 6. Drop old unique constraints if they exist
        $existingIndexes = collect(DB::select('SHOW INDEX FROM project_worker_schedules'))
            ->pluck('Key_name')->unique()->toArray();

        if (in_array('project_worker_schedules_project_worker_id_scheduled_date_unique', $existingIndexes)) {
            Schema::table('project_worker_schedules', function (Blueprint $table) {
                $table->dropUnique('project_worker_schedules_project_worker_id_scheduled_date_unique');
            });
        }
        if (in_array('pws_worker_date_unique', $existingIndexes)) {
            Schema::table('project_worker_schedules', function (Blueprint $table) {
                $table->dropUnique('pws_worker_date_unique');
            });
        }

        // 7. Add new unique constraint and FK constraints (skip if already present)
        $existingIndexes = collect(DB::select('SHOW INDEX FROM project_worker_schedules'))
            ->pluck('Key_name')->unique()->toArray();

        $existingNewFks = collect(DB::select("
            SELECT COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'project_worker_schedules'
              AND REFERENCED_TABLE_NAME IS NOT NULL
        "))->pluck('COLUMN_NAME')->toArray();

        Schema::table('project_worker_schedules', function (Blueprint $table) use ($existingIndexes, $existingNewFks) {
            if (! in_array('pws_project_worker_date_unique', $existingIndexes)) {
                $table->unique(['project_id', 'worker_id', 'scheduled_date'], 'pws_project_worker_date_unique');
            }
            if (! in_array('project_id', $existingNewFks)) {
                $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
            }
            if (! in_array('worker_id', $existingNewFks)) {
                $table->foreign('worker_id')->references('id')->on('workers')->cascadeOnDelete();
            }
        });

        // 8. Drop old column (FK already dropped in step 5)
        if (Schema::hasColumn('project_worker_schedules', 'project_worker_id')) {
            Schema::table('project_worker_schedules', function (Blueprint $table) {
                $table->dropColumn('project_worker_id');
            });
        }
    }

    public function down(): void
    {
        // 1. Re-add project_worker_id as nullable
        if (! Schema::hasColumn('project_worker_schedules', 'project_worker_id')) {
            Schema::table('project_worker_schedules', function (Blueprint $table) {
                $table->unsignedBigInteger('project_worker_id')->nullable()->after('id');
            });
        }

        // 2. Backfill project_worker_id from project_workers
        DB::statement('
            UPDATE project_worker_schedules pws
            JOIN project_workers pw ON pw.project_id = pws.project_id AND pw.worker_id = pws.worker_id
            SET pws.project_worker_id = pw.id
            WHERE pws.project_worker_id IS NULL
        ');

        // 3. Make NOT NULL and add FK via raw SQL
        DB::statement('ALTER TABLE project_worker_schedules MODIFY COLUMN project_worker_id BIGINT UNSIGNED NOT NULL');

        $existingFks = collect(DB::select("
            SELECT CONSTRAINT_NAME, COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'project_worker_schedules'
              AND REFERENCED_TABLE_NAME IS NOT NULL
              AND COLUMN_NAME = 'project_worker_id'
        "))->pluck('CONSTRAINT_NAME')->toArray();

        if (empty($existingFks)) {
            Schema::table('project_worker_schedules', function (Blueprint $table) {
                $table->foreign('project_worker_id')
                    ->references('id')
                    ->on('project_workers')
                    ->cascadeOnDelete();
            });
        }

        // 4. Drop new unique and restore old one
        $existingIndexes = collect(DB::select('SHOW INDEX FROM project_worker_schedules'))
            ->pluck('Key_name')->unique()->toArray();

        Schema::table('project_worker_schedules', function (Blueprint $table) use ($existingIndexes) {
            if (in_array('pws_project_worker_date_unique', $existingIndexes)) {
                $table->dropUnique('pws_project_worker_date_unique');
            }
            if (! in_array('pws_worker_date_unique', $existingIndexes)) {
                $table->unique(['project_worker_id', 'scheduled_date'], 'pws_worker_date_unique');
            }
        });

        // 5. Drop FK constraints on project_id and worker_id, then drop columns
        $existingNewFks = collect(DB::select("
            SELECT CONSTRAINT_NAME, COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'project_worker_schedules'
              AND REFERENCED_TABLE_NAME IS NOT NULL
        "))->toArray();

        foreach ($existingNewFks as $fk) {
            if (in_array($fk->COLUMN_NAME, ['project_id', 'worker_id'])) {
                DB::statement("ALTER TABLE project_worker_schedules DROP FOREIGN KEY `{$fk->CONSTRAINT_NAME}`");
            }
        }

        $toDrop = array_filter(['project_id', 'worker_id'], fn ($col) => Schema::hasColumn('project_worker_schedules', $col));
        if (! empty($toDrop)) {
            Schema::table('project_worker_schedules', function (Blueprint $table) use ($toDrop) {
                $table->dropColumn($toDrop);
            });
        }
    }
};
