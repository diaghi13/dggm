<?php

namespace App\Domains\Project\Models;

use App\Domains\Quote\Models\QuoteItem;
use App\Enums\ProjectServiceBillingUnit;
use App\Enums\ProjectServiceStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProjectService extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_id',
        'description',
        'quantity',
        'unit_price',
        'cost_price',
        'billing_unit',
        'is_from_quote',
        'quote_item_id',
        'status',
        'notes',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'is_from_quote' => 'boolean',
            'billing_unit' => ProjectServiceBillingUnit::class,
            'status' => ProjectServiceStatus::class,
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function quoteItem(): BelongsTo
    {
        return $this->belongsTo(QuoteItem::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function workers(): BelongsToMany
    {
        return $this->belongsToMany(ProjectWorker::class, 'project_service_workers')
            ->withPivot(['assigned_hours', 'notes'])
            ->withTimestamps();
    }

    // ==================== ACCESSORS ====================

    public function getTotalAttribute(): float
    {
        return (float) $this->quantity * (float) $this->unit_price;
    }

    public function getMarginAttribute(): float
    {
        if ($this->cost_price === null) {
            return 0.0;
        }

        return $this->total - ((float) $this->quantity * (float) $this->cost_price);
    }

    public function getMarginPercentageAttribute(): float
    {
        if ($this->total == 0) {
            return 0.0;
        }

        return round(($this->margin / $this->total) * 100, 2);
    }
}
