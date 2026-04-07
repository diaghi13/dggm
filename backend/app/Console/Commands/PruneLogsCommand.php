<?php

namespace App\Console\Commands;

use App\Models\EmailLog;
use App\Models\Landlord\LandlordSetting;
use App\Models\SystemErrorLog;
use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PruneLogsCommand extends Command
{
    protected $signature = 'logs:prune';

    protected $description = 'Elimina i log obsoleti di tutti i tenant in base alla retention configurata';

    public function handle(): int
    {
        // Read retention values once from central landlord settings.
        $failedJobsDays = (int) LandlordSetting::get('logs.failed_jobs_retention_days', 30);
        $errorDays = (int) LandlordSetting::get('logs.system_error_retention_days', 30);
        $emailDays = (int) LandlordSetting::get('logs.email_log_retention_days', 90);

        // Prune failed_jobs from the central DB.
        $deleted = DB::table('failed_jobs')
            ->where('failed_at', '<', now()->subDays($failedJobsDays))
            ->delete();

        $this->info("failed_jobs: eliminati {$deleted} record (>{$failedJobsDays}gg)");

        // For every tenant, prune system_error_logs and email_logs.
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            try {
                tenancy()->initialize($tenant);

                $deletedErrors = SystemErrorLog::where('occurred_at', '<', now()->subDays($errorDays))->delete();
                $deletedEmails = EmailLog::where('created_at', '<', now()->subDays($emailDays))->delete();

                $this->line("  [{$tenant->name}] system_errors: -{$deletedErrors} | email_logs: -{$deletedEmails}");
            } catch (\Throwable $e) {
                $this->warn("  [{$tenant->name}] errore: {$e->getMessage()}");
            } finally {
                tenancy()->reset();
            }
        }

        $this->info('Pruning completato.');

        return self::SUCCESS;
    }
}
