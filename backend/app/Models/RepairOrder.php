<?php

namespace App\Models;

use App\Domains\Product\Models\Product;
use App\Domains\Project\Models\ProjectMaterialIncident;
use App\Domains\Warehouse\Models\Inventory;
use App\Domains\Warehouse\Models\RentalReturnInspectionItem;
use App\Enums\RepairOrderStatus;
use App\Enums\RepairType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class RepairOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id',
        'inventory_id',
        'incident_id',
        'inspection_item_id',
        'repair_type',
        'supplier_id',
        'quantity',
        'sent_date',
        'expected_return_date',
        'actual_return_date',
        'repair_cost',
        'repair_notes',
        'status',
        'created_by_user_id',
        'resolved_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'repair_type' => RepairType::class,
            'status' => RepairOrderStatus::class,
            'sent_date' => 'date',
            'expected_return_date' => 'date',
            'actual_return_date' => 'date',
            'quantity' => 'decimal:2',
            'repair_cost' => 'decimal:2',
        ];
    }

    // Relationships

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function inventory(): BelongsTo
    {
        return $this->belongsTo(Inventory::class);
    }

    public function incident(): BelongsTo
    {
        return $this->belongsTo(ProjectMaterialIncident::class, 'incident_id');
    }

    public function inspectionItem(): BelongsTo
    {
        return $this->belongsTo(RentalReturnInspectionItem::class, 'inspection_item_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by_user_id');
    }

    // Business methods

    public function isOverdue(): bool
    {
        return $this->expected_return_date !== null
            && $this->expected_return_date->isPast()
            && ! in_array($this->status, [RepairOrderStatus::Completed, RepairOrderStatus::Unrepairable]);
    }
}
