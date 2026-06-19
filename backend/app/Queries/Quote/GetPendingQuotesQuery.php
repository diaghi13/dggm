<?php

namespace App\Queries\Quote;

use App\Domains\Quote\Models\Quote;
use Illuminate\Database\Eloquent\Collection;

class GetPendingQuotesQuery
{
    public function execute(): Collection
    {
        return Quote::pending()
            ->with(['customer', 'projectManager'])
            ->orderBy('issue_date', 'desc')
            ->get();
    }
}
