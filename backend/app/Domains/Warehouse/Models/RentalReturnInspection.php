<?php

namespace App\Domains\Warehouse\Models;

use App\Domains\Project\Models\Project;
use App\Enums\InspectionStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RentalReturnInspection extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'ddt_id',
        'project_id',
        'inspected_by_user_id',
        'inspection_date',
        'status',
        'overall_notes',
    ];

    protected function casts(): array
    {
        return [
            'inspection_date' => 'date',
            'status' => InspectionStatus::class,
        ];
    }

    // Relationships

    public function ddt(): BelongsTo
    {
        return $this->belongsTo(Ddt::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function inspectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspected_by_user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(RentalReturnInspectionItem::class, 'inspection_id');
    }

    // Business methods

    public function isCompleted(): bool
    {
        return $this->status === InspectionStatus::Completed;
    }

    public function allItemsReviewed(): bool
    {
        return $this->items()->whereNull('condition')->doesntExist();
    }
}
