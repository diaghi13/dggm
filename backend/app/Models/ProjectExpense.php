<?php

namespace App\Models;

use App\Enums\ProjectExpenseCategory;
use App\Enums\ProjectExpenseStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class ProjectExpense extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'project_id',
        'project_worker_id',
        'submitted_by_user_id',
        'category',
        'description',
        'amount',
        'expense_date',
        'is_billable_to_client',
        'receipt_media_id',
        'status',
        'approved_by_user_id',
        'approved_at',
        'rejection_reason',
        'notes',
        'is_budgeted',
        'budgeted_amount',
        'billable_to_final_balance',
    ];

    protected function casts(): array
    {
        return [
            'category' => ProjectExpenseCategory::class,
            'amount' => 'decimal:2',
            'expense_date' => 'date',
            'is_billable_to_client' => 'boolean',
            'status' => ProjectExpenseStatus::class,
            'approved_at' => 'datetime',
            'is_budgeted' => 'boolean',
            'budgeted_amount' => 'decimal:2',
            'billable_to_final_balance' => 'boolean',
        ];
    }

    // ==================== MEDIA ====================

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('receipts')
            ->useDisk('public')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);
    }

    public function getReceiptUrlAttribute(): ?string
    {
        return $this->getFirstMediaUrl('receipts') ?: null;
    }

    // ==================== RELATIONSHIPS ====================

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function projectWorker(): BelongsTo
    {
        return $this->belongsTo(ProjectWorker::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    // ==================== ACCESSORS ====================

    public function getIsApprovedAttribute(): bool
    {
        return in_array($this->status, [
            ProjectExpenseStatus::AutoApproved,
            ProjectExpenseStatus::Approved,
        ]);
    }

    public function getVarianceAttribute(): float
    {
        return (float) $this->amount - (float) ($this->budgeted_amount ?? 0);
    }

    // ==================== SCOPES ====================

    public function scopeSubmitted($query)
    {
        return $query->where('status', ProjectExpenseStatus::Submitted->value);
    }

    public function scopeApproved($query)
    {
        return $query->whereIn('status', [
            ProjectExpenseStatus::AutoApproved->value,
            ProjectExpenseStatus::Approved->value,
        ]);
    }

    public function scopeBillable($query)
    {
        return $query->where('is_billable_to_client', true);
    }

    public function scopeForProject($query, int $projectId)
    {
        return $query->where('project_id', $projectId);
    }
}
