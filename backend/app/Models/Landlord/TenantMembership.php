<?php

declare(strict_types=1);

namespace App\Models\Landlord;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantMembership extends Model
{
    protected $connection = 'landlord';

    protected $table = 'tenant_memberships';

    protected $fillable = [
        'global_user_id',
        'tenant_id',
        'role',
        'status',
        'invitation_token',
        'invited_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'invited_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function globalUser(): BelongsTo
    {
        return $this->belongsTo(GlobalUser::class, 'global_user_id');
    }
}
