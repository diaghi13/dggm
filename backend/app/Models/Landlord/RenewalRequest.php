<?php

declare(strict_types=1);

namespace App\Models\Landlord;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RenewalRequest extends Model
{
    protected $connection = 'landlord';

    protected $table = 'renewal_requests';

    protected $fillable = [
        'tenant_id',
        'tenant_subscription_id',
        'type',
        'status',
        'requested_by_global_user_id',
        'addons',
        'target_plan_id',
        'prorated_amount',
        'cycle_days_total',
        'cycle_days_remaining',
        'billing_cycle',
        'notes',
        'admin_notes',
        'processed_at',
        'processed_by_global_user_id',
    ];

    protected function casts(): array
    {
        return [
            'addons' => 'array',
            'target_plan_id' => 'integer',
            'prorated_amount' => 'decimal:2',
            'processed_at' => 'datetime',
        ];
    }

    public function tenantSubscription(): BelongsTo
    {
        return $this->belongsTo(TenantSubscription::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(GlobalUser::class, 'requested_by_global_user_id', 'id');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(GlobalUser::class, 'processed_by_global_user_id', 'id');
    }

    public function targetPlan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'target_plan_id');
    }

    // --- Helper methods ---

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isAddonRequest(): bool
    {
        return $this->type === 'addon_add';
    }

    public function isRenewalRequest(): bool
    {
        return in_array($this->type, ['renewal', 'renewal_with_addons'], true);
    }

    public function isPlanChangeRequest(): bool
    {
        return in_array($this->type, ['upgrade', 'downgrade'], true);
    }

    // --- Scopes ---

    public function scopePending(Builder $query): void
    {
        $query->where('status', 'pending');
    }

    public function scopeForTenant(Builder $query, string $tenantId): void
    {
        $query->where('tenant_id', $tenantId);
    }
}
