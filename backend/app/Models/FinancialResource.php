<?php

namespace App\Models;

use App\Enums\FinancialResourceType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Financial Resource Model
 *
 * Represents a financial resource/destination for the company
 * (bank accounts, cash registers, credit cards/POS)
 *
 * @property int $id
 * @property FinancialResourceType $type
 * @property string $name
 * @property string|null $description
 * @property array|null $details
 * @property bool $is_active
 * @property bool $is_default
 * @property int $sort_order
 * @property string|null $notes
 */
class FinancialResource extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'type',
        'name',
        'description',
        'details',
        'is_active',
        'is_default',
        'sort_order',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'type' => FinancialResourceType::class,
            'details' => 'array',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeByType($query, FinancialResourceType $type)
    {
        return $query->where('type', $type);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Accessors
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->is_default
            ? "{$this->name} (Default)"
            : $this->name;
    }

    /**
     * Get specific detail field
     */
    public function getDetail(string $key, $default = null)
    {
        return $this->details[$key] ?? $default;
    }

    /**
     * Get formatted bank account info
     */
    public function getFormattedBankInfoAttribute(): ?string
    {
        if ($this->type !== FinancialResourceType::BANK_ACCOUNT) {
            return null;
        }

        $parts = array_filter([
            $this->getDetail('bank_name'),
            $this->getDetail('iban'),
            $this->getDetail('swift') ? "SWIFT: {$this->getDetail('swift')}" : null,
        ]);

        return implode(' - ', $parts);
    }

    /**
     * Get formatted cash info
     */
    public function getFormattedCashInfoAttribute(): ?string
    {
        if ($this->type !== FinancialResourceType::CASH) {
            return null;
        }

        return $this->getDetail('location');
    }

    /**
     * Get formatted card info
     */
    public function getFormattedCardInfoAttribute(): ?string
    {
        if ($this->type !== FinancialResourceType::CARD) {
            return null;
        }

        $parts = array_filter([
            $this->getDetail('card_type'),
            $this->getDetail('provider'),
            $this->getDetail('last_digits') ? "****{$this->getDetail('last_digits')}" : null,
        ]);

        return implode(' - ', $parts);
    }

    /**
     * Boot model
     */
    protected static function boot()
    {
        parent::boot();

        // When setting a new default, unset previous default of same type
        static::saving(function ($model) {
            if ($model->is_default && $model->isDirty('is_default')) {
                static::where('type', $model->type)
                    ->where('is_default', true)
                    ->where('id', '!=', $model->id)
                    ->update(['is_default' => false]);
            }
        });
    }
}
