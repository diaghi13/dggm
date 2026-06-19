<?php

namespace App\Domains\Project\Models;

use App\Enums\AvailabilityCheckStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProjectAvailabilityCheck extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'project_availability_checks';

    protected $fillable = [
        'project_id',
        'checked_by_user_id',
        'checked_at',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'checked_at' => 'datetime',
            'status' => AvailabilityCheckStatus::class,
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function checkedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_by_user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ProjectAvailabilityCheckItem::class, 'check_id');
    }

    // ==================== SCOPES ====================

    public function scopeResolved($query)
    {
        return $query->where('status', AvailabilityCheckStatus::Resolved);
    }

    public function scopePending($query)
    {
        return $query->where('status', AvailabilityCheckStatus::Pending);
    }
}
