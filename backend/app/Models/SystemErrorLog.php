<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemErrorLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'exception_class',
        'message',
        'stack_trace',
        'severity',
        'url',
        'method',
        'user_id',
        'context',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'context' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeCritical(Builder $query): Builder
    {
        return $query->where('severity', 'critical');
    }

    public function scopeErrors(Builder $query): Builder
    {
        return $query->where('severity', 'error');
    }

    public function scopeWarnings(Builder $query): Builder
    {
        return $query->where('severity', 'warning');
    }
}
