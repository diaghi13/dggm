<?php

namespace App\Models;

use App\Enums\StockMovementType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'ddt_id',
        'product_id',
        'warehouse_id',
        'type',
        'quantity',
        'unit_cost',
        'movement_date',
        'from_warehouse_id',
        'to_warehouse_id',
        'project_id',
        'supplier_id',
        'supplier_document',
        'user_id',
        'notes',
        'reference_document',
    ];

    protected function casts(): array
    {
        return [
            'type' => StockMovementType::class,
            'quantity' => 'decimal:2',
            'unit_cost' => 'decimal:2',
            'movement_date' => 'date',
        ];
    }

    // Relationships
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function fromWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    public function toWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ddt(): BelongsTo
    {
        return $this->belongsTo(Ddt::class);
    }

    // Scopes
    public function scopeByType($query, StockMovementType $type)
    {
        return $query->where('type', $type);
    }

    public function scopeForProject($query, int $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopeInPeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('movement_date', [$startDate, $endDate]);
    }

    public function scopeRentals($query)
    {
        return $query->whereIn('type', [
            StockMovementType::RENTAL_OUT,
            StockMovementType::RENTAL_RETURN,
        ]);
    }

    public function scopeOutgoing($query)
    {
        return $query->whereIn('type', [
            StockMovementType::OUTPUT,
            StockMovementType::WASTE,
            StockMovementType::RENTAL_OUT,
            StockMovementType::SITE_ALLOCATION,
        ]);
    }

    public function scopeIncoming($query)
    {
        return $query->whereIn('type', [
            StockMovementType::INTAKE,
            StockMovementType::RETURN,
            StockMovementType::RENTAL_RETURN,
            StockMovementType::SITE_RETURN,
        ]);
    }

    // Accessors
    public function getTotalValueAttribute(): float
    {
        return $this->quantity * ($this->unit_cost ?? 0);
    }

    // Generate unique code
    public static function generateCode(): string
    {
        return app(\App\Services\CodeGeneratorService::class)->generate('movement', [
            'date' => now()->format('Ymd'),
        ]);
    }

    // Boot
    protected static function booted(): void
    {
        static::creating(function ($movement) {
            if (empty($movement->code)) {
                $movement->code = self::generateCode();
            }
        });
    }
}
