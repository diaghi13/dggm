<?php

declare(strict_types=1);

namespace App\Models\Landlord;

use Illuminate\Database\Eloquent\Model;

class ServiceBroadcast extends Model
{
    protected $connection = 'landlord';

    protected $table = 'service_broadcasts';

    // Possible status values: pending | dispatched | failed | scheduled | cancelled

    protected $fillable = [
        'title',
        'message',
        'type',
        'target_roles',
        'created_by_global_user_id',
        'status',
        'dispatched_at',
        'scheduled_at',
        'tenant_count',
        'user_count',
    ];

    protected function casts(): array
    {
        return [
            'target_roles' => 'array',
            'dispatched_at' => 'datetime',
            'scheduled_at' => 'datetime',
        ];
    }
}
