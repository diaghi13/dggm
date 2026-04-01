<?php

namespace App\Console\Commands;

use App\Models\Landlord\GlobalUser;
use Illuminate\Console\Command;

class VerifyExistingUsersCommand extends Command
{
    protected $signature = 'users:verify-existing
                            {--force : Salta la conferma}';

    protected $description = 'Segna tutti i GlobalUser esistenti come verificati (email_verified_at)';

    public function handle(): int
    {
        $count = GlobalUser::whereNull('email_verified_at')->count();

        if ($count === 0) {
            $this->info('Nessun utente da verificare.');

            return self::SUCCESS;
        }

        $this->info("Trovati {$count} utenti non verificati.");

        if (! $this->option('force') && ! $this->confirm("Aggiornare {$count} utenti impostando email_verified_at = now()?")) {
            $this->warn('Operazione annullata.');

            return self::FAILURE;
        }

        GlobalUser::whereNull('email_verified_at')
            ->update(['email_verified_at' => now()]);

        $this->info("✓ {$count} utenti aggiornati con email_verified_at.");

        return self::SUCCESS;
    }
}
