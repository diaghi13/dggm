<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Site extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, SoftDeletes;

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

    // Relationships
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

    // Scopes
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

    // Accessors
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

    // Helper methods
    public function isWithinGpsRange(float $latitude, float $longitude): bool
    {
        if (! $this->latitude || ! $this->longitude) {
            return true; // No GPS validation if coordinates not set
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

        return $earthRadius * $c; // returns distance in meters
    }

    // Media Collections
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
                'application/x-dwg', // AutoCAD
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
