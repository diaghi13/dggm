<?php

declare(strict_types=1);

namespace App\Models\Landlord;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanFeature extends Model
{
    protected $connection = 'landlord';

    protected $table = 'plan_features';

    protected $fillable = ['plan_id', 'feature_key', 'price', 'price_yearly', 'limits'];

    protected function casts(): array
    {
        return [
            'limits' => 'array',
            'price' => 'decimal:2',
            'price_yearly' => 'decimal:2',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }
}
