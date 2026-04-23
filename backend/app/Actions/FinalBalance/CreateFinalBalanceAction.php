<?php

namespace App\Actions\FinalBalance;

use App\Data\CreateFinalBalanceData;
use App\Models\FinalBalance;
use App\Services\CodeGeneratorService;
use Illuminate\Support\Facades\DB;

class CreateFinalBalanceAction
{
    public function execute(CreateFinalBalanceData $data): FinalBalance
    {
        return DB::transaction(function () use ($data) {
            $code = app(CodeGeneratorService::class)->generate('final_balance');

            return FinalBalance::create([
                'project_id' => $data->project_id,
                'quote_id' => $data->quote_id,
                'customer_id' => $data->customer_id,
                'title' => $data->title,
                'reference_text' => $data->reference_text,
                'notes' => $data->notes,
                'tax_percentage' => $data->tax_percentage,
                'discount_percentage' => $data->discount_percentage,
                'is_partial' => $data->is_partial,
                'code' => $code,
                'created_by_user_id' => auth()->id(),
            ]);
        });
    }
}
