<?php

declare(strict_types=1);

namespace App\Models\Landlord;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantSubscriptionFeature extends Model
{
    protected $connection = 'landlord';

    protected $table = 'tenant_subscription_features';

    protected $fillable = ['tenant_subscription_id', 'feature_key', 'price_at_purchase'];

    protected function casts(): array
    {
        return [
            'price_at_purchase' => 'decimal:2',
        ];
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(TenantSubscription::class, 'tenant_subscription_id');
    }
}
