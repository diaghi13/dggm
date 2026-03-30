<?php

namespace App\Models;

use App\Enums\ProjectExpenseCategory;
use App\Enums\ProjectExpenseStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectExpense extends Model
{
    use HasFactory;

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
        ];
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
