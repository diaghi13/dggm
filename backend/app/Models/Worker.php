<?php

namespace App\Models;

use App\Enums\ContractType;
use App\Enums\RateContext;
use App\Enums\RateType;
use App\Enums\WorkerType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Worker extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'user_id',
        'worker_type',
        'contract_type',
        'first_name',
        'last_name',
        'tax_code',
        'vat_number',
        'birth_date',
        'birth_place',
        'email',
        'phone',
        'mobile',
        'address',
        'city',
        'province',
        'postal_code',
        'country',
        'supplier_id',
        'hire_date',
        'termination_date',
        'contract_end_date',
        'job_title',
        'job_level',
        'specializations',
        'certifications',
        'is_active',
        'can_drive_company_vehicles',
        'has_safety_training',
        'safety_training_expires_at',
        'notes',
        'internal_notes',
        'payment_notes',
    ];

    protected function casts(): array
    {
        return [
            'worker_type' => WorkerType::class,
            'contract_type' => ContractType::class,
            'birth_date' => 'date',
            'hire_date' => 'date',
            'termination_date' => 'date',
            'contract_end_date' => 'date',
            'safety_training_expires_at' => 'date',
            'specializations' => 'array',
            'certifications' => 'array',
            'is_active' => 'boolean',
            'can_drive_company_vehicles' => 'boolean',
            'has_safety_training' => 'boolean',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function rates(): HasMany
    {
        return $this->hasMany(WorkerRate::class);
    }

    public function payrollData(): HasOne
    {
        return $this->hasOne(WorkerPayrollData::class);
    }

    public function sites(): BelongsToMany
    {
        return $this->belongsToMany(Site::class, 'site_workers')
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

    public function siteAssignments(): HasMany
    {
        return $this->hasMany(SiteWorker::class);
    }

    public function laborCosts(): HasMany
    {
        return $this->hasMany(SiteLaborCost::class);
    }

    // ==================== SCOPES ====================

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->whereNull('termination_date');
    }

    public function scopeByType($query, WorkerType $type)
    {
        return $query->where('worker_type', $type);
    }

    public function scopeEmployees($query)
    {
        return $query->where('worker_type', WorkerType::Employee);
    }

    public function scopeFreelancers($query)
    {
        return $query->where('worker_type', WorkerType::Freelancer);
    }

    public function scopeExternalWorkers($query)
    {
        return $query->where('worker_type', WorkerType::External);
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_active', true)
            ->whereNull('termination_date');
    }

    public function scopeWithValidSafetyTraining($query)
    {
        return $query->where('has_safety_training', true)
            ->where(function ($q) {
                $q->whereNull('safety_training_expires_at')
                    ->orWhere('safety_training_expires_at', '>=', now());
            });
    }

    // ==================== ACCESSORS ====================

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function getDisplayNameAttribute(): string
    {
        if ($this->worker_type === WorkerType::External && $this->supplier) {
            return "{$this->full_name} ({$this->supplier->company_name})";
        }

        return $this->full_name;
    }

    public function getIsEmployeeAttribute(): bool
    {
        return $this->worker_type === WorkerType::Employee;
    }

    public function getIsFreelancerAttribute(): bool
    {
        return $this->worker_type === WorkerType::Freelancer;
    }

    public function getIsExternalAttribute(): bool
    {
        return $this->worker_type === WorkerType::External;
    }

    public function getSafetyTrainingValidAttribute(): bool
    {
        if (! $this->has_safety_training) {
            return false;
        }

        if (! $this->safety_training_expires_at) {
            return true; // No expiration = always valid
        }

        return $this->safety_training_expires_at->isFuture();
    }

    // ==================== METHODS ====================

    /**
     * Get current rate for specific context and rate type
     */
    public function getCurrentRate(
        RateContext $context,
        RateType $rateType,
        ?\DateTime $date = null
    ): ?WorkerRate {
        $date = $date ?? now();

        return $this->rates()
            ->where('context', $context)
            ->where('rate_type', $rateType)
            ->where('valid_from', '<=', $date)
            ->where(function ($query) use ($date) {
                $query->whereNull('valid_to')
                    ->orWhere('valid_to', '>=', $date);
            })
            ->orderBy('valid_from', 'desc')
            ->first();
    }

    /**
     * Get total hours worked on a specific site
     */
    public function getTotalHoursOnSite(int $siteId): float
    {
        return $this->laborCosts()
            ->where('site_id', $siteId)
            ->sum('hours_worked') ?? 0;
    }

    /**
     * Get total cost generated on a specific site
     */
    public function getTotalCostOnSite(int $siteId): float
    {
        return $this->laborCosts()
            ->where('site_id', $siteId)
            ->sum('total_cost') ?? 0;
    }

    /**
     * Get active site assignments
     */
    public function getActiveSites()
    {
        return $this->sites()
            ->wherePivot('is_active', true)
            ->wherePivot('assigned_from', '<=', now())
            ->where(function ($query) {
                $query->wherePivotNull('assigned_to')
                    ->orWhere('site_workers.assigned_to', '>=', now());
            })
            ->get();
    }

    /**
     * Check if worker is assigned to a specific site
     */
    public function isAssignedToSite(int $siteId): bool
    {
        return $this->sites()
            ->where('sites.id', $siteId)
            ->wherePivot('is_active', true)
            ->wherePivot('assigned_from', '<=', now())
            ->where(function ($query) {
                $query->wherePivotNull('assigned_to')
                    ->orWhere('site_workers.assigned_to', '>=', now());
            })
            ->exists();
    }

    // ==================== BOOT ====================

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($worker) {
            if (! $worker->code) {
                $worker->code = self::generateCode();
            }
        });
    }

    /**
     * Generate unique worker code (WRK-00001)
     */
    private static function generateCode(): string
    {
        $lastWorker = self::withTrashed()
            ->where('code', 'like', 'WRK-%')
            ->orderByRaw('CAST(SUBSTRING(code, 5) AS UNSIGNED) DESC')
            ->first();

        if (! $lastWorker) {
            return 'WRK-00001';
        }

        $lastNumber = (int) substr($lastWorker->code, 4);
        $newNumber = $lastNumber + 1;

        return 'WRK-'.str_pad($newNumber, 5, '0', STR_PAD_LEFT);
    }
}
