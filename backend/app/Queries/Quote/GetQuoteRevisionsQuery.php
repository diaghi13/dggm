<?php

namespace App\Queries\Quote;

use App\Models\Quote;
use Illuminate\Database\Eloquent\Collection;

class GetQuoteRevisionsQuery
{
    public static function execute(Quote $quote): Collection
    {
        $originalId = $quote->original_quote_id ?? $quote->id;

        return Quote::query()
            ->where(function ($q) use ($originalId) {
                $q->where('id', $originalId)
                    ->orWhere('original_quote_id', $originalId);
            })
            ->orderBy('version')
            ->get(['id', 'code', 'version', 'status', 'issue_date', 'total_amount', 'revision_notes', 'is_current_version']);
    }
}
