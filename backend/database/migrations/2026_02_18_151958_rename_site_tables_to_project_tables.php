<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Rename site-related tables to project-related tables.
 *
 * NOTE: On MySQL production, the initial partial run already completed:
 *  - sites → projects
 *  - site_materials → project_materials (with site_id → project_id)
 *  - All FK constraints on the above tables were dropped (but not yet re-added)
 * On fresh SQLite test databases, all renames happen here.
 */
return new class extends Migration
{
    public function up(): void
    {
        // =====================================================================
        // Step 0: Handle fresh databases (e.g. SQLite tests) where the initial
        //         partial MySQL run has not yet been applied.
        // =====================================================================
        if (Schema::hasTable('sites')) {
            Schema::rename('sites', 'projects');
        }

        if (Schema::hasTable('site_materials')) {
            Schema::rename('site_materials', 'project_materials');
            Schema::table('project_materials', function (Blueprint $table) {
                $table->renameColumn('site_id', 'project_id');
            });
        }

        // =====================================================================
        // Step 1: Rename site_workers → project_workers, site_id → project_id
        // =====================================================================
        if (Schema::hasTable('site_workers')) {
            Schema::rename('site_workers', 'project_workers');
        }

        if (Schema::hasColumn('project_workers', 'site_id')) {
            Schema::table('project_workers', function (Blueprint $table) {
                $table->renameColumn('site_id', 'project_id');
            });
        }

        // =====================================================================
        // Step 2: Rename site_labor_costs → project_labor_costs, site_id → project_id
        // =====================================================================
        if (Schema::hasTable('site_labor_costs')) {
            Schema::rename('site_labor_costs', 'project_labor_costs');
        }

        if (Schema::hasColumn('project_labor_costs', 'site_id')) {
            Schema::table('project_labor_costs', function (Blueprint $table) {
                $table->renameColumn('site_id', 'project_id');
            });
        }

        // =====================================================================
        // Step 3: Rename site_roles → project_roles
        // =====================================================================
        if (Schema::hasTable('site_roles')) {
            Schema::rename('site_roles', 'project_roles');
        }

        // =====================================================================
        // Step 4: Rename site_worker_role → project_worker_role
        //         and rename site_worker_id → project_worker_id
        //         and rename site_role_id → project_role_id
        // =====================================================================
        if (Schema::hasTable('site_worker_role')) {
            Schema::rename('site_worker_role', 'project_worker_role');
        }

        Schema::table('project_worker_role', function (Blueprint $table) {
            $table->renameColumn('site_worker_id', 'project_worker_id');
            $table->renameColumn('site_role_id', 'project_role_id');
        });

        // =====================================================================
        // Step 5: Rename site_id → project_id in other tables
        // =====================================================================
        if (Schema::hasColumn('ddts', 'site_id')) {
            Schema::table('ddts', function (Blueprint $table) {
                $table->renameColumn('site_id', 'project_id');
            });
        }

        if (Schema::hasColumn('stock_movements', 'site_id')) {
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->renameColumn('site_id', 'project_id');
            });
        }

        if (Schema::hasColumn('material_requests', 'site_id')) {
            Schema::table('material_requests', function (Blueprint $table) {
                $table->renameColumn('site_id', 'project_id');
            });
        }

        if (Schema::hasColumn('quotes', 'site_id')) {
            Schema::table('quotes', function (Blueprint $table) {
                $table->renameColumn('site_id', 'project_id');
            });
        }

        // =====================================================================
        // Step 6: Re-add all FK constraints (MySQL only — SQLite doesn't
        //         support ALTER TABLE ADD FOREIGN KEY reliably in migrations)
        // =====================================================================
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('project_materials', function (Blueprint $table) {
                $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
            });

            Schema::table('project_workers', function (Blueprint $table) {
                $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
            });

            Schema::table('project_labor_costs', function (Blueprint $table) {
                $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
            });

            Schema::table('project_worker_role', function (Blueprint $table) {
                $table->foreign('project_worker_id')->references('id')->on('project_workers')->cascadeOnDelete();
                $table->foreign('project_role_id')->references('id')->on('project_roles')->cascadeOnDelete();
            });

            Schema::table('ddts', function (Blueprint $table) {
                $table->foreign('project_id')->references('id')->on('projects')->nullOnDelete();
            });

            Schema::table('stock_movements', function (Blueprint $table) {
                $table->foreign('project_id')->references('id')->on('projects')->nullOnDelete();
            });

            Schema::table('material_requests', function (Blueprint $table) {
                $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
            });

            Schema::table('quotes', function (Blueprint $table) {
                $table->foreign('project_id')->references('id')->on('projects')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        // Drop new FK constraints (MySQL only)
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('project_worker_role', function (Blueprint $table) {
                $table->dropForeign(['project_worker_id']);
                $table->dropForeign(['project_role_id']);
            });

            Schema::table('ddts', function (Blueprint $table) {
                $table->dropForeign(['project_id']);
            });

            Schema::table('stock_movements', function (Blueprint $table) {
                $table->dropForeign(['project_id']);
            });

            Schema::table('material_requests', function (Blueprint $table) {
                $table->dropForeign(['project_id']);
            });

            Schema::table('quotes', function (Blueprint $table) {
                $table->dropForeign(['project_id']);
            });

            Schema::table('project_materials', function (Blueprint $table) {
                $table->dropForeign(['project_id']);
            });

            Schema::table('project_workers', function (Blueprint $table) {
                $table->dropForeign(['project_id']);
            });

            Schema::table('project_labor_costs', function (Blueprint $table) {
                $table->dropForeign(['project_id']);
            });
        }

        // Rename columns back
        Schema::table('project_worker_role', function (Blueprint $table) {
            $table->renameColumn('project_worker_id', 'site_worker_id');
            $table->renameColumn('project_role_id', 'site_role_id');
        });

        Schema::table('ddts', function (Blueprint $table) {
            $table->renameColumn('project_id', 'site_id');
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->renameColumn('project_id', 'site_id');
        });

        Schema::table('material_requests', function (Blueprint $table) {
            $table->renameColumn('project_id', 'site_id');
        });

        Schema::table('quotes', function (Blueprint $table) {
            $table->renameColumn('project_id', 'site_id');
        });

        Schema::table('project_workers', function (Blueprint $table) {
            $table->renameColumn('project_id', 'site_id');
        });

        Schema::table('project_labor_costs', function (Blueprint $table) {
            $table->renameColumn('project_id', 'site_id');
        });

        Schema::table('project_materials', function (Blueprint $table) {
            $table->renameColumn('project_id', 'site_id');
        });

        // Rename tables back
        Schema::rename('project_worker_role', 'site_worker_role');
        Schema::rename('project_roles', 'site_roles');
        Schema::rename('project_labor_costs', 'site_labor_costs');
        Schema::rename('project_workers', 'site_workers');
        Schema::rename('project_materials', 'site_materials');
        Schema::rename('projects', 'sites');

        // Re-add original FK constraints (MySQL only)
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('site_worker_role', function (Blueprint $table) {
                $table->foreign('site_worker_id')->references('id')->on('site_workers')->cascadeOnDelete();
                $table->foreign('site_role_id')->references('id')->on('site_roles')->cascadeOnDelete();
            });

            Schema::table('ddts', function (Blueprint $table) {
                $table->foreign('site_id')->references('id')->on('sites')->nullOnDelete();
            });

            Schema::table('stock_movements', function (Blueprint $table) {
                $table->foreign('site_id')->references('id')->on('sites')->nullOnDelete();
            });

            Schema::table('material_requests', function (Blueprint $table) {
                $table->foreign('site_id')->references('id')->on('sites')->cascadeOnDelete();
            });

            Schema::table('quotes', function (Blueprint $table) {
                $table->foreign('site_id')->references('id')->on('sites')->nullOnDelete();
            });

            Schema::table('site_materials', function (Blueprint $table) {
                $table->foreign('site_id')->references('id')->on('sites')->cascadeOnDelete();
            });

            Schema::table('site_workers', function (Blueprint $table) {
                $table->foreign('site_id')->references('id')->on('sites')->cascadeOnDelete();
            });

            Schema::table('site_labor_costs', function (Blueprint $table) {
                $table->foreign('site_id')->references('id')->on('sites')->cascadeOnDelete();
            });
        }
    }
};
