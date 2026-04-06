<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 *
 * @property-read \App\Models\Tenant|null $tenant
 * @property string $token
 * @property string $tenant_id
 * @property int $quote_id
 * @property \Illuminate\Support\Carbon|null $expires_at
 */
class QuoteToken extends Model
{
    // Force central DB connection even when called from a tenant context
    protected $connection = 'landlord';

    protected $fillable = ['token', 'tenant_id', 'quote_id', 'expires_at'];

    protected function casts(): array
    {
        return ['expires_at' => 'datetime'];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
