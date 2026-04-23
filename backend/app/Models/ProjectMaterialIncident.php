<?php

namespace App\Models;

use App\Enums\DamageSeverity;
use App\Enums\IncidentStatus;
use App\Enums\IncidentType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class ProjectMaterialIncident extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, SoftDeletes;

    protected $fillable = [
        'project_id',
        'project_material_id',
        'reported_by_user_id',
        'incident_type',
        'damage_severity',
        'description',
        'incident_date',
        'is_chargeable_to_client',
        'charge_amount',
        'charge_basis',
        'status',
        'resolution_notes',
        'resolved_by_user_id',
        'resolved_at',
        'ddt_item_id',
    ];

    protected function casts(): array
    {
        return [
            'incident_type' => IncidentType::class,
            'damage_severity' => DamageSeverity::class,
            'status' => IncidentStatus::class,
            'incident_date' => 'date',
            'resolved_at' => 'datetime',
            'is_chargeable_to_client' => 'boolean',
            'charge_amount' => 'decimal:2',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function projectMaterial(): BelongsTo
    {
        return $this->belongsTo(ProjectMaterial::class);
    }

    public function reportedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by_user_id');
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by_user_id');
    }

    public function ddtItem(): BelongsTo
    {
        return $this->belongsTo(DdtItem::class);
    }

    // ==================== MEDIA ====================

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('incident_photos')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    // ==================== SCOPES ====================

    public function scopeOpen($query)
    {
        return $query->where('status', IncidentStatus::Open);
    }

    public function scopeChargeable($query)
    {
        return $query->where('is_chargeable_to_client', true);
    }
}
