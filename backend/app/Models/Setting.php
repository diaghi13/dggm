<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Setting extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'user_id',
        'is_public',
        'description',
        'validation_rules',
        'allowed_values',
        'min_value',
        'max_value',
        'default_value',
        'order',
        'is_feature_flag',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'validation_rules' => 'array',
            'allowed_values' => 'array',
            'min_value' => 'decimal:6',
            'max_value' => 'decimal:6',
            'is_feature_flag' => 'boolean',
        ];
    }

    /**
     * Relationship: setting belongs to a user (if user-specific)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if setting is global (not user-specific)
     */
    public function isGlobal(): bool
    {
        return $this->user_id === null;
    }

    /**
     * Get the typed value based on the type field
     */
    public function getTypedValue(): mixed
    {
        return match ($this->type) {
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'number' => is_numeric($this->value) ? (str_contains($this->value, '.') ? (float) $this->value : (int) $this->value) : $this->value,
            'json' => json_decode($this->value, true),
            default => $this->value,
        };
    }

    /**
     * Set the value and automatically determine the type
     */
    public function setTypedValue(mixed $value): void
    {
        if (is_bool($value)) {
            $this->type = 'boolean';
            $this->value = $value ? '1' : '0';
        } elseif (is_numeric($value)) {
            $this->type = 'number';
            $this->value = (string) $value;
        } elseif (is_array($value) || is_object($value)) {
            $this->type = 'json';
            $this->value = json_encode($value);
        } else {
            $this->type = 'string';
            $this->value = (string) $value;
        }
    }

    /**
     * Scope: only global settings
     */
    public function scopeGlobal($query)
    {
        return $query->whereNull('user_id');
    }

    /**
     * Scope: only user-specific settings
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: filter by group
     */
    public function scopeInGroup($query, string $group)
    {
        return $query->where('group', $group);
    }

    /**
     * Scope: only public settings
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope: only feature flags
     */
    public function scopeFeatureFlags($query)
    {
        return $query->where('is_feature_flag', true);
    }

    /**
     * Scope: order by display order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order')->orderBy('key');
    }

    /**
     * Validate value against setting's validation rules
     */
    public function validateValue(mixed $value): bool
    {
        // Base type validation
        $typeValid = match ($this->type) {
            'boolean' => is_bool($value) || in_array($value, ['0', '1', 0, 1, true, false], true),
            'number' => is_numeric($value),
            'json' => is_array($value) || is_object($value) || json_decode($value) !== null,
            'email' => filter_var($value, FILTER_VALIDATE_EMAIL) !== false,
            'url' => filter_var($value, FILTER_VALIDATE_URL) !== false,
            'color' => is_string($value) && preg_match('/^#[0-9A-Fa-f]{6}$/', $value),
            'date' => strtotime($value) !== false,
            'datetime' => strtotime($value) !== false,
            default => true, // string, file, enum checked below
        };

        if (! $typeValid) {
            return false;
        }

        // Enum validation
        if ($this->type === 'enum' && $this->allowed_values) {
            if (! in_array($value, $this->allowed_values, true)) {
                return false;
            }
        }

        // Number range validation
        if ($this->type === 'number') {
            if ($this->min_value !== null && $value < $this->min_value) {
                return false;
            }
            if ($this->max_value !== null && $value > $this->max_value) {
                return false;
            }
        }

        // Custom validation rules
        if ($this->validation_rules) {
            $validator = validator(['value' => $value], ['value' => $this->validation_rules]);

            return ! $validator->fails();
        }

        return true;
    }

    /**
     * Reset to default value
     */
    public function reset(): void
    {
        if ($this->default_value !== null) {
            // Preserve existing type and convert default value accordingly
            $existingType = $this->type;
            $value = $this->default_value;

            switch ($existingType) {
                case 'boolean':
                    if (is_string($value)) {
                        $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                    }
                    $this->value = $value ? '1' : '0';
                    break;

                case 'number':
                    $this->value = (string) $value;
                    break;

                case 'json':
                    $this->value = is_string($value) ? $value : json_encode($value);
                    break;

                case 'email':
                case 'url':
                case 'color':
                case 'date':
                case 'datetime':
                case 'file':
                case 'enum':
                case 'string':
                default:
                    $this->value = (string) $value;
                    break;
            }

            $this->save();
        }
    }

    /**
     * Check if this is a feature flag
     */
    public function isFeatureFlag(): bool
    {
        return $this->is_feature_flag;
    }

    /**
     * Get setting value by key (cached)
     *
     * @param  string  $key  Setting key (supports dot notation for groups, e.g. 'pricing.auto_update_on_purchase')
     * @param  mixed  $default  Default value if setting not found
     * @param  int|null  $userId  User ID for user-specific settings (null for global)
     * @return mixed Setting value with correct type casting
     */
    public static function get(string $key, mixed $default = null, ?int $userId = null): mixed
    {
        return app(\App\Services\SettingService::class)->get($key, $default, $userId);
    }

    /**
     * Set setting value by key (creates or updates)
     *
     * @param  string  $key  Setting key
     * @param  mixed  $value  Value to set
     * @param  int|null  $userId  User ID for user-specific settings (null for global)
     * @param  string|null  $group  Setting group
     * @param  bool  $isPublic  Whether setting is publicly accessible
     */
    public static function set(string $key, mixed $value, ?int $userId = null, ?string $group = null, bool $isPublic = false): Setting
    {
        return app(\App\Services\SettingService::class)->set($key, $value, $userId, $group, $isPublic);
    }

    /**
     * Check if setting exists
     */
    public static function has(string $key, ?int $userId = null): bool
    {
        return app(\App\Services\SettingService::class)->has($key, $userId);
    }

    /**
     * Delete setting by key
     */
    public static function forget(string $key, ?int $userId = null): bool
    {
        return app(\App\Services\SettingService::class)->delete($key, $userId);
    }
}
