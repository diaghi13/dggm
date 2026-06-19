<?php

namespace App\Domains\Project\Models;

use App\Domains\Product\Models\ProductSubrentalSupplier;
use App\Enums\AvailabilityResolution;
use App\Enums\AvailabilityStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectAvailabilityCheckItem extends Model
{
    use HasFactory;

    protected $table = 'project_availability_check_items';

    protected $fillable = [
        'check_id',
        'project_material_id',
        'planned_qty',
        'available_qty',
        'reserved_qty',
        'shortage_qty',
        'availability_status',
        'resolution',
        'subrental_supplier_id',
        'subrental_estimated_cost',
        'resolved_at',
        'resolved_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'availability_status' => AvailabilityStatus::class,
            'resolution' => AvailabilityResolution::class,
            'resolved_at' => 'datetime',
            'planned_qty' => 'decimal:2',
            'available_qty' => 'decimal:2',
            'reserved_qty' => 'decimal:2',
            'shortage_qty' => 'decimal:2',
            'subrental_estimated_cost' => 'decimal:2',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function availabilityCheck(): BelongsTo
    {
        return $this->belongsTo(ProjectAvailabilityCheck::class, 'check_id');
    }

    public function projectMaterial(): BelongsTo
    {
        return $this->belongsTo(ProjectMaterial::class);
    }

    public function subrentalSupplier(): BelongsTo
    {
        return $this->belongsTo(ProductSubrentalSupplier::class, 'subrental_supplier_id');
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by_user_id');
    }
}
