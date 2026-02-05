<?php

namespace App\Models;

use App\Data\PaymentTermData;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\LaravelData\WithData;

class PaymentTerm extends Model
{
    use HasFactory, WithData;

    protected string $dataClass = PaymentTermData::class;

    protected $fillable = [
        'code',
        'name',
        'description',
        'days',
        'payment_type',
        'is_default',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'days' => 'integer',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    // Helper methods
    public static function getDefault(): ?self
    {
        return self::default()->active()->first();
    }
}
