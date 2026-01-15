<?php

namespace App\Models;

use App\Enums\MaterialRequestPriority;
use App\Enums\MaterialRequestStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MaterialRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'site_id',
        'material_id',
        'requested_by_worker_id',
        'requested_by_user_id',
        'quantity_requested',
        'unit_of_measure',
        'status',
        'priority',
        'reason',
        'notes',
        'needed_by',
        'responded_by_user_id',
        'responded_at',
        'response_notes',
        'rejection_reason',
        'quantity_approved',
        'approved_by_user_id',
        'approved_at',
        'quantity_delivered',
        'delivered_at',
        'delivered_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'quantity_requested' => 'decimal:2',
            'quantity_approved' => 'decimal:2',
            'quantity_delivered' => 'decimal:2',
            'status' => MaterialRequestStatus::class,
            'priority' => MaterialRequestPriority::class,
            'needed_by' => 'date',
            'responded_at' => 'datetime',
            'approved_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    // Relationships
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    public function requestedByWorker(): BelongsTo
    {
        return $this->belongsTo(Worker::class, 'requested_by_worker_id');
    }

    public function requestedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function respondedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responded_by_user_id');
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function deliveredByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delivered_by_user_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', MaterialRequestStatus::Pending);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', MaterialRequestStatus::Approved);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', MaterialRequestStatus::Rejected);
    }

    public function scopeDelivered($query)
    {
        return $query->where('status', MaterialRequestStatus::Delivered);
    }

    public function scopeUrgent($query)
    {
        return $query->where('priority', MaterialRequestPriority::Urgent);
    }

    public function scopeHighPriority($query)
    {
        return $query->whereIn('priority', [MaterialRequestPriority::High, MaterialRequestPriority::Urgent]);
    }

    public function scopeBySite($query, int $siteId)
    {
        return $query->where('site_id', $siteId);
    }

    public function scopeByWorker($query, int $workerId)
    {
        return $query->where('requested_by_worker_id', $workerId);
    }

    // Helper methods
    public function isPending(): bool
    {
        return $this->status === MaterialRequestStatus::Pending;
    }

    public function isApproved(): bool
    {
        return $this->status === MaterialRequestStatus::Approved;
    }

    public function isRejected(): bool
    {
        return $this->status === MaterialRequestStatus::Rejected;
    }

    public function isDelivered(): bool
    {
        return $this->status === MaterialRequestStatus::Delivered;
    }

    public function canBeApproved(): bool
    {
        return $this->isPending();
    }

    public function canBeRejected(): bool
    {
        return $this->isPending();
    }

    public function canBeDelivered(): bool
    {
        return $this->isApproved();
    }
}
