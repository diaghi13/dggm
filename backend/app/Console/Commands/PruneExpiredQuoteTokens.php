<?php

namespace App\Console\Commands;

use App\Models\QuoteToken;
use Illuminate\Console\Command;

class PruneExpiredQuoteTokens extends Command
{
    protected $signature = 'quotes:prune-tokens';

    protected $description = 'Delete expired quote customer action tokens from the central lookup table';

    public function handle(): int
    {
        $deleted = QuoteToken::where('expires_at', '<', now()->subDays(7))->delete();

        $this->info("Pruned {$deleted} expired quote token(s).");

        return self::SUCCESS;
    }
}
