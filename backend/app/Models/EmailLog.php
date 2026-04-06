<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'email_account_id',
        'document_type',
        'document_id',
        'created_by',
        'to_email',
        'to_name',
        'subject',
        'status',
        'attempts',
        'last_error',
        'sent_at',
        'failed_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
            'metadata' => 'array',
            'sent_at' => 'datetime',
            'failed_at' => 'datetime',
            'attempts' => 'integer',
        ];
    }

    public function emailAccount(): BelongsTo
    {
        return $this->belongsTo(EmailAccount::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeSent($query)
    {
        return $query->where('status', 'sent');
    }
}
