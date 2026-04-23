<?php

namespace App\Models;

use App\Enums\InspectionItemAction;
use App\Enums\ItemCondition;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RentalReturnInspectionItem extends Model
{
    protected $fillable = [
        'inspection_id',
        'ddt_item_id',
        'product_id',
        'total_quantity',
        'quantity_good',
        'quantity_damaged',
        'quantity_write_off',
        'condition',
        'damage_description',
        'repair_estimate',
        'action',
        'incident_id',
        'warehouse_id',
    ];

    protected function casts(): array
    {
        return [
            'total_quantity' => 'decimal:2',
            'quantity_good' => 'decimal:2',
            'quantity_damaged' => 'decimal:2',
            'quantity_write_off' => 'decimal:2',
            'repair_estimate' => 'decimal:2',
            'condition' => ItemCondition::class,
            'action' => InspectionItemAction::class,
        ];
    }

    // Relationships

    public function inspection(): BelongsTo
    {
        return $this->belongsTo(RentalReturnInspection::class, 'inspection_id');
    }

    public function ddtItem(): BelongsTo
    {
        return $this->belongsTo(DdtItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function incident(): BelongsTo
    {
        return $this->belongsTo(ProjectMaterialIncident::class, 'incident_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    // Business methods

    public function isReviewed(): bool
    {
        return $this->condition !== null;
    }
}
