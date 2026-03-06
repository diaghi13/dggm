<?php

namespace App\Models;

use App\Enums\LaborCostType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectLaborCost extends Model
{
    use HasFactory;

    protected $table = 'project_labor_costs';

    protected $fillable = [
        'project_id',
        'cost_type',
        'worker_id',
        'contractor_id',
        'time_entry_id',
        'description',
        'work_date',
        'hours_worked',
        'quantity',
        'unit_rate',
        'total_cost',
        'currency',
        'is_overtime',
        'is_holiday',
        'cost_category',
        'invoice_number',
        'invoice_date',
        'is_invoiced',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'cost_type' => LaborCostType::class,
            'work_date' => 'date',
            'invoice_date' => 'date',
            'hours_worked' => 'decimal:2',
            'quantity' => 'decimal:2',
            'unit_rate' => 'decimal:2',
            'total_cost' => 'decimal:2',
            'is_overtime' => 'boolean',
            'is_holiday' => 'boolean',
            'is_invoiced' => 'boolean',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function worker(): BelongsTo
    {
        return $this->belongsTo(Worker::class);
    }

    public function contractor(): BelongsTo
    {
        return $this->belongsTo(Contractor::class);
    }

    // ==================== SCOPES ====================

    public function scopeForProject($query, int $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopeForWorker($query, int $workerId)
    {
        return $query->where('worker_id', $workerId);
    }

    public function scopeForContractor($query, int $contractorId)
    {
        return $query->where('contractor_id', $contractorId);
    }

    public function scopeByType($query, LaborCostType $type)
    {
        return $query->where('cost_type', $type);
    }

    public function scopeInternalLabor($query)
    {
        return $query->where('cost_type', LaborCostType::InternalLabor);
    }

    public function scopeContractorLabor($query)
    {
        return $query->whereIn('cost_type', [
            LaborCostType::Contractor,
            LaborCostType::Subcontractor,
        ]);
    }

    public function scopeInvoiced($query)
    {
        return $query->where('is_invoiced', true);
    }

    public function scopePendingInvoice($query)
    {
        return $query->where('is_invoiced', false)
            ->whereNotNull('contractor_id');
    }

    public function scopeInPeriod($query, \DateTime $startDate, \DateTime $endDate)
    {
        return $query->whereBetween('work_date', [$startDate, $endDate]);
    }

    public function scopeInMonth($query, int $year, int $month)
    {
        return $query->whereYear('work_date', $year)
            ->whereMonth('work_date', $month);
    }

    // ==================== ACCESSORS ====================

    public function getIsInternalAttribute(): bool
    {
        return $this->cost_type === LaborCostType::InternalLabor;
    }

    public function getIsContractorAttribute(): bool
    {
        return in_array($this->cost_type, [
            LaborCostType::Contractor,
            LaborCostType::Subcontractor,
        ]);
    }

    public function getHourlyRateAttribute(): ?float
    {
        if (! $this->hours_worked || $this->hours_worked == 0) {
            return null;
        }

        return $this->total_cost / $this->hours_worked;
    }

    public function getWorkPeriodAttribute(): string
    {
        return $this->work_date->format('F Y');
    }

    // ==================== METHODS ====================

    public function calculateTotalCost(): float
    {
        if ($this->hours_worked) {
            $this->total_cost = $this->unit_rate * $this->hours_worked;
        } else {
            $this->total_cost = $this->unit_rate * $this->quantity;
        }

        return $this->total_cost;
    }

    public function markAsInvoiced(string $invoiceNumber, \DateTime $invoiceDate): void
    {
        $this->invoice_number = $invoiceNumber;
        $this->invoice_date = $invoiceDate;
        $this->is_invoiced = true;
        $this->save();
    }

    // ==================== BOOT ====================

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($laborCost) {
            if (! $laborCost->total_cost) {
                $laborCost->calculateTotalCost();
            }
        });

        static::updating(function ($laborCost) {
            if ($laborCost->isDirty(['hours_worked', 'quantity', 'unit_rate'])) {
                $laborCost->calculateTotalCost();
            }
        });
    }
}
