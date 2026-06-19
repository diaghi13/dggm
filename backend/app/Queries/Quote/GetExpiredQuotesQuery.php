<?php

namespace App\Queries\Quote;

use App\Domains\Quote\Models\Quote;
use Illuminate\Database\Eloquent\Collection;

class GetExpiredQuotesQuery
{
    public function execute(): Collection
    {
        return Quote::expired()
            ->with(['customer', 'projectManager'])
            ->orderBy('expiry_date', 'desc')
            ->get();
    }
}
