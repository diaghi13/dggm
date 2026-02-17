<?php

namespace App\Casts;

use Carbon\Carbon;
use Spatie\LaravelData\Casts\Cast;
use Spatie\LaravelData\Support\Creation\CreationContext;
use Spatie\LaravelData\Support\DataProperty;

/**
 * Flexible Date Cast
 *
 * Supports multiple date formats:
 * - Y-m-d (2026-03-12)
 * - Y-m-d\TH:i:s (2026-03-12T14:30:00)
 * - Y-m-d\TH:i:sP (2026-03-12T14:30:00+01:00)
 */
class FlexibleDateCast implements Cast
{
    protected array $formats = [
        'Y-m-d\TH:i:sP',      // ISO 8601 with timezone
        'Y-m-d\TH:i:s',       // ISO 8601 without timezone
        'Y-m-d H:i:s',        // SQL datetime
        'Y-m-d',              // Simple date
    ];

    public function cast(DataProperty $property, mixed $value, array $properties, CreationContext $context): ?Carbon
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value;
        }

        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance($value);
        }

        // Try each format
        foreach ($this->formats as $format) {
            try {
                $date = Carbon::createFromFormat($format, $value);

                if ($date !== false) {
                    return $date;
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        // Last resort: try Carbon parse
        try {
            return Carbon::parse($value);
        } catch (\Exception $e) {
            throw new \InvalidArgumentException(
                "Could not cast date `{$value}` into a Carbon instance. Tried formats: ".implode(', ', $this->formats)
            );
        }
    }
}
