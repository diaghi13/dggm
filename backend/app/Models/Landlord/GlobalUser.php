<?php

declare(strict_types=1);

namespace App\Models\Landlord;

use App\Notifications\ResetPasswordNotification;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class GlobalUser extends Authenticatable implements CanResetPasswordContract
{
    use CanResetPassword, HasApiTokens, HasUuids, Notifiable, SoftDeletes;

    protected $connection = 'landlord';

    protected $table = 'global_users';

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'tax_code',
        'fiscal_code',
        'address',
        'city',
        'province',
        'postal_code',
        'country',
        'iban',
        'is_landlord_admin',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_landlord_admin' => 'boolean',
        ];
    }

    public function tenantMemberships(): HasMany
    {
        return $this->hasMany(TenantMembership::class, 'global_user_id');
    }

    /**
     * Returns the profile data to use as defaults when syncing worker records in tenant DBs.
     * Only non-null values are returned so that existing tenant-specific data is preserved.
     */
    public function workerProfileDefaults(): array
    {
        $nameParts = explode(' ', $this->name, 2);

        return array_filter([
            'first_name' => $nameParts[0] ?? null,
            'last_name' => $nameParts[1] ?? null,
            'email' => $this->email,
            'phone' => $this->phone,
            'tax_code' => $this->tax_code,
            'address' => $this->address,
            'city' => $this->city,
            'province' => $this->province,
            'postal_code' => $this->postal_code,
            'country' => $this->country,
        ], fn ($v) => $v !== null);
    }

    /**
     * Send the password reset notification using our custom notification class.
     */
    public function sendPasswordResetNotification(#[\SensitiveParameter] $token): void
    {
        $this->notify(new ResetPasswordNotification($token, config('app.name')));
    }

    /**
     * Override tokens relationship to use LandlordPersonalAccessToken (landlord DB),
     * ensuring GlobalUser tokens are stored cross-tenant and not affected by the
     * default Sanctum::$personalAccessTokenModel setting.
     */
    public function tokens(): MorphMany
    {
        return $this->morphMany(LandlordPersonalAccessToken::class, 'tokenable');
    }
}
