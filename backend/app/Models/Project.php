<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Project extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, SoftDeletes;

    protected $table = 'projects';

    protected $fillable = [
        'code',
        'name',
        'description',
        'customer_id',
        'quote_id',
        'address',
        'city',
        'province',
        'postal_code',
        'country',
        'latitude',
        'longitude',
        'gps_radius',
        'project_manager_id',
        'estimated_amount',
        'actual_cost',
        'invoiced_amount',
        'start_date',
        'estimated_end_date',
        'actual_end_date',
        'status',
        'priority',
        'notes',
        'internal_notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'gps_radius' => 'integer',
            'estimated_amount' => 'decimal:2',
            'actual_cost' => 'decimal:2',
            'invoiced_amount' => 'decimal:2',
            'start_date' => 'date',
            'estimated_end_date' => 'date',
            'actual_end_date' => 'date',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }

    public function projectManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'project_manager_id');
    }

    public function workers(): BelongsToMany
    {
        return $this->belongsToMany(Worker::class, 'project_workers')
            ->withPivot([
                'site_role',
                'assigned_from',
                'assigned_to',
                'hourly_rate_override',
                'estimated_hours',
                'is_active',
                'notes',
            ])
            ->withTimestamps();
    }

    public function projectWorkers(): HasMany
    {
        return $this->hasMany(ProjectWorker::class);
    }

    public function materials(): HasMany
    {
        return $this->hasMany(ProjectMaterial::class);
    }

    public function laborCosts(): HasMany
    {
        return $this->hasMany(ProjectLaborCost::class);
    }

    // ==================== SCOPES ====================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOfStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeForProjectManager($query, int $userId)
    {
        return $query->where('project_manager_id', $userId);
    }

    // ==================== ACCESSORS ====================

    public function getFullAddressAttribute(): string
    {
        return trim("{$this->address}, {$this->postal_code} {$this->city} ({$this->province})");
    }

    public function getMarginAttribute(): float
    {
        if (! $this->estimated_amount) {
            return 0;
        }

        return $this->estimated_amount - $this->actual_cost;
    }

    public function getMarginPercentageAttribute(): float
    {
        if (! $this->estimated_amount || $this->estimated_amount == 0) {
            return 0;
        }

        return ($this->margin / $this->estimated_amount) * 100;
    }

    public function getTotalLaborCostAttribute(): float
    {
        return $this->laborCosts()->sum('total_cost') ?? 0;
    }

    public function getInternalLaborCostAttribute(): float
    {
        return $this->laborCosts()
            ->internalLabor()
            ->sum('total_cost') ?? 0;
    }

    public function getContractorCostAttribute(): float
    {
        return $this->laborCosts()
            ->contractorLabor()
            ->sum('total_cost') ?? 0;
    }

    // ==================== METHODS ====================

    public function updateActualCost(): void
    {
        $laborCost = $this->total_labor_cost;
        $materialCost = $this->materials()->sum(\Illuminate\Support\Facades\DB::raw('used_quantity * actual_unit_cost'));
        $this->actual_cost = $laborCost + $materialCost;
        $this->saveQuietly();
    }

    public function isWithinGpsRange(float $latitude, float $longitude): bool
    {
        if (! $this->latitude || ! $this->longitude) {
            return true;
        }

        $distance = $this->calculateDistance($latitude, $longitude, $this->latitude, $this->longitude);

        return $distance <= $this->gps_radius;
    }

    private function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000; // meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    // ==================== MEDIA ====================

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('documents')
            ->acceptsMimeTypes([
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])
            ->useDisk('public');

        $this->addMediaCollection('photos')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
            ->useDisk('public');

        $this->addMediaCollection('technical_drawings')
            ->acceptsMimeTypes([
                'application/pdf',
                'image/jpeg',
                'image/png',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/x-dwg',
            ])
            ->useDisk('public');

        $this->addMediaCollection('reports')
            ->acceptsMimeTypes([
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
            ])
            ->useDisk('public');
    }
}
