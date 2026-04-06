<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmailAccount extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'provider',
        'from_email',
        'from_name',
        'smtp_host',
        'smtp_port',
        'smtp_encryption',
        'smtp_username',
        'smtp_password',
        'oauth_access_token',
        'oauth_refresh_token',
        'oauth_token_expires_at',
        'signature',
        'signature_plain',
        'is_active',
        'is_default',
        'last_tested_at',
        'last_test_success',
        'last_test_error',
    ];

    protected function casts(): array
    {
        return [
            'smtp_password' => 'encrypted',
            'oauth_access_token' => 'encrypted',
            'oauth_refresh_token' => 'encrypted',
            'oauth_token_expires_at' => 'datetime',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'last_tested_at' => 'datetime',
            'last_test_success' => 'boolean',
        ];
    }

    /**
     * Scope: only active accounts
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: only default accounts
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Check if OAuth token is expired
     */
    public function isOAuthExpired(): bool
    {
        if ($this->oauth_token_expires_at === null) {
            return false;
        }

        return $this->oauth_token_expires_at->isPast();
    }

    /**
     * Get SMTP configuration array for Mail::build()
     */
    public function getSmtpConfig(): array
    {
        return [
            'transport' => 'smtp',
            'host' => $this->smtp_host,
            'port' => $this->smtp_port,
            'encryption' => $this->smtp_encryption,
            'username' => $this->smtp_username,
            'password' => $this->smtp_password,
        ];
    }
}
