<?php

namespace App\Actions\Quote;

use App\Domains\Project\Models\Project;
use App\Domains\Quote\Models\Quote;
use App\Events\QuoteConvertedToProject;
use Illuminate\Support\Facades\DB;

class ConvertQuoteToProjectAction
{
    public function execute(Quote $quote): ?Project
    {
        if ($quote->status !== 'approved') {
            return null;
        }

        return DB::transaction(function () use ($quote) {
            $project = $quote->convertToProject();

            QuoteConvertedToProject::dispatch($quote, $project, [
                'converted_by' => auth()->id(),
                'converted_at' => now(),
            ]);

            return $project;
        });
    }
}
