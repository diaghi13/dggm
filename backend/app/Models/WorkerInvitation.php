<?php

namespace App\Models;

use App\Enums\ContractType;
use App\Enums\WorkerType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class WorkerInvitation extends Model
{
    protected $fillable = [
        'email',
        'token',
        'first_name',
        'last_name',
        'phone',
        'invited_by_user_id',
        'supplier_id',
        'worker_type',
        'contract_type',
        'job_title',
        'metadata',
        'expires_at',
        'accepted_at',
        'created_user_id',
    ];

    protected function casts(): array
    {
        return [
            'worker_type' => WorkerType::class,
            'contract_type' => ContractType::class,
            'metadata' => 'array',
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by_user_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function createdUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_user_id');
    }

    // ==================== SCOPES ====================

    public function scopePending($query)
    {
        return $query->whereNull('accepted_at')
            ->where('expires_at', '>', now());
    }

    public function scopeExpired($query)
    {
        return $query->whereNull('accepted_at')
            ->where('expires_at', '<=', now());
    }

    public function scopeAccepted($query)
    {
        return $query->whereNotNull('accepted_at');
    }

    // ==================== METHODS ====================

    public function isExpired(): bool
    {
        return $this->accepted_at === null && $this->expires_at->isPast();
    }

    public function isPending(): bool
    {
        return $this->accepted_at === null && $this->expires_at->isFuture();
    }

    public function isAccepted(): bool
    {
        return $this->accepted_at !== null;
    }

    public static function generateToken(): string
    {
        return Str::random(64);
    }

    public function getAcceptUrl(): string
    {
        return url("/accept-invitation/{$this->token}");
    }
}
