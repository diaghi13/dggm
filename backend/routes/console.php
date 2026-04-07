<?php

use App\Jobs\ProcessSubscriptionRemindersJob;
use App\Jobs\RefreshOAuthEmailTokensJob;
use App\Jobs\SuspendExpiredSubscriptionsJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Backup Schedule
|--------------------------------------------------------------------------
|
| Central DB  → daily at 02:00 via spatie/laravel-backup
| Tenant DBs  → daily at 03:00 via backup:tenants (custom command)
| Cleanup     → weekly on Sunday at 04:00 via spatie/laravel-backup
|
| Make sure the scheduler is running on the server:
|   * * * * * cd /path/to/app && php artisan schedule:run >> /dev/null 2>&1
|
*/

// Backup the central (landlord) database.
Schedule::command('backup:run --only-db')
    ->dailyAt('02:00')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/backup.log'));

// Backup all tenant databases.
Schedule::command('backup:tenants')
    ->dailyAt('03:00')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/backup.log'));

// Clean up old backups according to the retention policy in config/backup.php.
Schedule::command('backup:clean')
    ->weeklyOn(0, '04:00')
    ->appendOutputTo(storage_path('logs/backup.log'));

// Monitor backup health and send alerts if backups are stale or too large.
Schedule::command('backup:monitor')
    ->dailyAt('05:00');

// Proactively refresh OAuth access tokens for all tenant email accounts
// before they expire, to avoid send failures during the token window.
Schedule::job(RefreshOAuthEmailTokensJob::class)->hourly();

// Remove expired quote tokens from the central lookup table.
// A 7-day grace period is applied so recently-expired tokens are not
// deleted immediately, giving in-flight requests time to complete.
Schedule::command('quotes:prune-tokens')->weekly();

// Dispatch scheduled service broadcasts that have reached their send time.
Schedule::command('broadcasts:process-scheduled')->everyMinute();

// Prune obsolete logs (system errors, email logs, failed jobs) across all tenants.
Schedule::command('logs:prune')->dailyAt('02:30');

// Subscription lifecycle jobs.
// Suspensions run at midnight so access is cut as early as possible once the
// grace period expires. Reminders run at 08:00 so users see them at the start
// of their working day.
Schedule::job(new SuspendExpiredSubscriptionsJob)->dailyAt('00:00');
Schedule::job(new ProcessSubscriptionRemindersJob)->dailyAt('08:00');
