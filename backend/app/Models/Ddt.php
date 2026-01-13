<?php

namespace App\Models;

use App\Enums\DdtStatus;
use App\Enums\DdtType;
use App\Enums\ReturnReason;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Ddt extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, SoftDeletes;

    protected $fillable = [
        'code',
        'type',
        'supplier_id',
        'customer_id',
        'site_id',
        'from_warehouse_id',
        'to_warehouse_id',
        'ddt_number',
        'ddt_date',
        'transport_date',
        'delivered_at',
        'carrier_name',
        'tracking_number',
        'rental_start_date',
        'rental_end_date',
        'rental_actual_return_date',
        'parent_ddt_id',
        'return_reason',
        'return_notes',
        'status',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => DdtType::class,
            'status' => DdtStatus::class,
            'return_reason' => ReturnReason::class,
            'ddt_date' => 'date',
            'transport_date' => 'datetime',
            'delivered_at' => 'datetime',
            'rental_start_date' => 'date',
            'rental_end_date' => 'date',
            'rental_actual_return_date' => 'date',
        ];
    }

    // Relationships
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function fromWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    public function toWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(DdtItem::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function parentDdt(): BelongsTo
    {
        return $this->belongsTo(Ddt::class, 'parent_ddt_id');
    }

    public function childrenDdts(): HasMany
    {
        return $this->hasMany(Ddt::class, 'parent_ddt_id');
    }

    // Scopes
    public function scopeOfType($query, DdtType $type)
    {
        return $query->where('type', $type);
    }

    public function scopeOfStatus($query, DdtStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopeForWarehouse($query, int $warehouseId)
    {
        return $query->where('from_warehouse_id', $warehouseId)
            ->orWhere('to_warehouse_id', $warehouseId);
    }

    public function scopeForSite($query, int $siteId)
    {
        return $query->where('site_id', $siteId);
    }

    public function scopeIncoming($query)
    {
        return $query->where('type', DdtType::Incoming);
    }

    public function scopeOutgoing($query)
    {
        return $query->where('type', DdtType::Outgoing);
    }

    public function scopeRentals($query)
    {
        return $query->whereIn('type', [DdtType::RentalOut, DdtType::RentalReturn]);
    }

    public function scopeReturns($query)
    {
        return $query->whereIn('type', [DdtType::ReturnFromCustomer, DdtType::ReturnToSupplier]);
    }

    // Methods
    public function isIncoming(): bool
    {
        return $this->type === DdtType::Incoming;
    }

    public function isOutgoing(): bool
    {
        return $this->type === DdtType::Outgoing;
    }

    public function isRental(): bool
    {
        return in_array($this->type, [DdtType::RentalOut, DdtType::RentalReturn]);
    }

    public function isReturn(): bool
    {
        return in_array($this->type, [DdtType::ReturnFromCustomer, DdtType::ReturnToSupplier]);
    }

    public function getTotalItemsAttribute(): int
    {
        return $this->items()->count();
    }

    public function getTotalQuantityAttribute(): float
    {
        return $this->items()->sum('quantity');
    }

    public function canBeConfirmed(): bool
    {
        return $this->status === DdtStatus::Draft;
    }

    public function canBeCancelled(): bool
    {
        // Può essere annullato solo se non è ancora stato consegnato fisicamente
        return $this->status !== DdtStatus::Cancelled && is_null($this->delivered_at);
    }

    public function isDelivered(): bool
    {
        return ! is_null($this->delivered_at);
    }

    // Media Collections
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('documents')
            ->acceptsMimeTypes(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
            ->useDisk('public');
    }

    // Boot
    protected static function booted(): void
    {
        static::creating(function ($ddt) {
            if (empty($ddt->code)) {
                $ddt->code = self::generateCode();
            }
        });
    }

    public static function generateCode(): string
    {
        $date = now()->format('Y');
        $count = self::whereYear('created_at', now()->year)->count() + 1;

        return 'DDT-'.$date.'-'.str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}
