<?php

declare(strict_types=1);

namespace App\Models\Landlord;

use Illuminate\Database\Eloquent\Model;

class ServiceBroadcast extends Model
{
    protected $connection = 'landlord';

    protected $table = 'service_broadcasts';

    protected $fillable = [
        'title',
        'message',
        'type',
        'target_roles',
        'created_by_global_user_id',
        'status',
        'dispatched_at',
        'tenant_count',
        'user_count',
    ];

    protected function casts(): array
    {
        return [
            'target_roles' => 'array',
            'dispatched_at' => 'datetime',
        ];
    }
}
