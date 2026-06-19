<?php

namespace App\Models;

use App\Domains\Project\Models\ProjectExpense;
use App\Domains\Project\Models\ProjectMaterial;
use App\Domains\Project\Models\ProjectMaterialIncident;
use App\Domains\Project\Models\ProjectService;
use App\Domains\Quote\Models\QuoteItem;
use App\Enums\FinalBalanceItemType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinalBalanceItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'final_balance_id',
        'parent_id',
        'quote_item_id',
        'project_material_id',
        'project_service_id',
        'project_expense_id',
        'incident_id',
        'type',
        'description',
        'code',
        'unit',
        'quantity',
        'unit_price',
        'cost_price',
        'discount_percentage',
        'subtotal',
        'total',
        'is_manual',
        'sort_order',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'type' => FinalBalanceItemType::class,
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'discount_percentage' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'total' => 'decimal:2',
            'is_manual' => 'boolean',
        ];
    }

    // Relationships

    public function finalBalance(): BelongsTo
    {
        return $this->belongsTo(FinalBalance::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(FinalBalanceItem::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(FinalBalanceItem::class, 'parent_id')->orderBy('sort_order');
    }

    public function quoteItem(): BelongsTo
    {
        return $this->belongsTo(QuoteItem::class);
    }

    public function projectMaterial(): BelongsTo
    {
        return $this->belongsTo(ProjectMaterial::class);
    }

    public function projectService(): BelongsTo
    {
        return $this->belongsTo(ProjectService::class);
    }

    public function projectExpense(): BelongsTo
    {
        return $this->belongsTo(ProjectExpense::class);
    }

    public function incident(): BelongsTo
    {
        return $this->belongsTo(ProjectMaterialIncident::class, 'incident_id');
    }
}
