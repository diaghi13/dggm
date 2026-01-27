<?php

namespace App\ValueObjects;

use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Contracts\Database\Eloquent\Castable;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

/**
 * DateRange Value Object
 *
 * Rappresenta un intervallo di date (inizio - fine).
 *
 * Utile per:
 * - Sites (data inizio/fine lavori)
 * - Quotes (validità preventivo)
 * - Contracts (durata contratto)
 * - Reports (periodo analisi)
 *
 * Uso nel Model:
 * protected function casts(): array {
 *     return ['validity_period' => DateRange::class];
 * }
 *
 * Uso:
 * $site->work_period->getDurationInDays()
 * $site->work_period->includes($today)
 * $site->work_period->overlaps($otherPeriod)
 */
class DateRange implements Castable
{
    /**
     * @param  Carbon  $start  Data inizio
     * @param  Carbon|null  $end  Data fine (null = indefinito)
     */
    public function __construct(
        public readonly Carbon $start,
        public readonly ?Carbon $end = null
    ) {
        if ($this->end && $this->start->isAfter($this->end)) {
            throw new \InvalidArgumentException('Start date must be before or equal to end date');
        }
    }

    /**
     * Crea da array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            start: Carbon::parse($data['start'] ?? $data['start_date']),
            end: isset($data['end']) || isset($data['end_date'])
                ? Carbon::parse($data['end'] ?? $data['end_date'])
                : null
        );
    }

    /**
     * Crea da date strings
     */
    public static function fromStrings(string $start, ?string $end = null): self
    {
        return new self(
            start: Carbon::parse($start),
            end: $end ? Carbon::parse($end) : null
        );
    }

    /**
     * Crea periodo "da oggi per N giorni"
     */
    public static function fromToday(int $days): self
    {
        return new self(
            start: Carbon::today(),
            end: Carbon::today()->addDays($days)
        );
    }

    /**
     * Crea periodo "questo mese"
     */
    public static function thisMonth(): self
    {
        return new self(
            start: Carbon::now()->startOfMonth(),
            end: Carbon::now()->endOfMonth()
        );
    }

    /**
     * Crea periodo "quest'anno"
     */
    public static function thisYear(): self
    {
        return new self(
            start: Carbon::now()->startOfYear(),
            end: Carbon::now()->endOfYear()
        );
    }

    /**
     * Converte ad array
     */
    public function toArray(): array
    {
        return [
            'start' => $this->start->toDateString(),
            'end' => $this->end?->toDateString(),
        ];
    }

    /**
     * Durata in giorni
     */
    public function getDurationInDays(): ?int
    {
        if (! $this->end) {
            return null; // Indefinito
        }

        return (int) $this->start->diffInDays($this->end);
    }

    /**
     * Durata in settimane
     */
    public function getDurationInWeeks(): ?float
    {
        $days = $this->getDurationInDays();

        return $days ? round($days / 7, 1) : null;
    }

    /**
     * Durata in mesi (approssimata)
     */
    public function getDurationInMonths(): ?int
    {
        if (! $this->end) {
            return null;
        }

        return (int) $this->start->diffInMonths($this->end);
    }

    /**
     * Verifica se una data è inclusa nell'intervallo
     */
    public function includes(Carbon $date): bool
    {
        if ($this->end) {
            return $date->isBetween($this->start, $this->end, true);
        }

        // Senza end date, verifica solo se è dopo lo start
        return $date->isSameDay($this->start) || $date->isAfter($this->start);
    }

    /**
     * Verifica se include oggi
     */
    public function includesNow(): bool
    {
        return $this->includes(Carbon::now());
    }

    /**
     * Verifica se è passato (end date nel passato)
     */
    public function isPast(): bool
    {
        if (! $this->end) {
            return false;
        }

        return $this->end->isPast();
    }

    /**
     * Verifica se è futuro (start date nel futuro)
     */
    public function isFuture(): bool
    {
        return $this->start->isFuture();
    }

    /**
     * Verifica se è attivo/corrente (include oggi)
     */
    public function isActive(): bool
    {
        return $this->includesNow();
    }

    /**
     * Verifica se due intervalli si sovrappongono
     */
    public function overlaps(DateRange $other): bool
    {
        // Se uno dei due non ha end date, controlla solo se gli start si sovrappongono
        if (! $this->end || ! $other->end) {
            return true; // Troppo complesso senza end date, assumiamo overlap
        }

        // Due intervalli si sovrappongono se:
        // start1 <= end2 AND end1 >= start2
        return $this->start->lte($other->end) && $this->end->gte($other->start);
    }

    /**
     * Ottiene tutti i giorni nell'intervallo
     */
    public function getDays(): array
    {
        if (! $this->end) {
            throw new \LogicException('Cannot get days for open-ended range');
        }

        return iterator_to_array(
            CarbonPeriod::create($this->start, $this->end)->days()
        );
    }

    /**
     * Conta i giorni lavorativi (esclusi sabato e domenica)
     */
    public function getWorkingDays(): int
    {
        if (! $this->end) {
            throw new \LogicException('Cannot calculate working days for open-ended range');
        }

        $days = $this->getDays();

        return count(array_filter($days, fn (Carbon $day) => $day->isWeekday()));
    }

    /**
     * Formatta per display
     */
    public function format(string $separator = ' - '): string
    {
        $startFormatted = $this->start->format('d/m/Y');
        $endFormatted = $this->end?->format('d/m/Y') ?? 'Indefinito';

        return "{$startFormatted}{$separator}{$endFormatted}";
    }

    /**
     * Converte a stringa
     */
    public function __toString(): string
    {
        return $this->format();
    }

    /**
     * Estende la fine dell'intervallo
     */
    public function extendBy(int $days): self
    {
        if (! $this->end) {
            throw new \LogicException('Cannot extend open-ended range');
        }

        return new self($this->start, $this->end->copy()->addDays($days));
    }

    /**
     * Riduce la fine dell'intervallo
     */
    public function shortenBy(int $days): self
    {
        if (! $this->end) {
            throw new \LogicException('Cannot shorten open-ended range');
        }

        return new self($this->start, $this->end->copy()->subDays($days));
    }

    /**
     * Eloquent Cast Implementation
     */
    public static function castUsing(array $arguments): CastsAttributes
    {
        return new class implements CastsAttributes
        {
            public function get($model, string $key, $value, array $attributes): ?DateRange
            {
                if (is_null($value)) {
                    return null;
                }

                if ($value instanceof DateRange) {
                    return $value;
                }

                // Campi separati: {key}_start e {key}_end
                $startKey = $key.'_start';
                $endKey = $key.'_end';

                if (isset($attributes[$startKey])) {
                    return new DateRange(
                        start: Carbon::parse($attributes[$startKey]),
                        end: isset($attributes[$endKey]) ? Carbon::parse($attributes[$endKey]) : null
                    );
                }

                // Campi alternativi: start_date + end_date
                if (isset($attributes['start_date'])) {
                    return new DateRange(
                        start: Carbon::parse($attributes['start_date']),
                        end: isset($attributes['end_date']) ? Carbon::parse($attributes['end_date']) : null
                    );
                }

                return null;
            }

            public function set($model, string $key, $value, array $attributes): array
            {
                if (is_null($value)) {
                    return [
                        $key.'_start' => null,
                        $key.'_end' => null,
                    ];
                }

                if (is_array($value)) {
                    $value = DateRange::fromArray($value);
                }

                if (! $value instanceof DateRange) {
                    throw new \InvalidArgumentException('Value must be a DateRange instance');
                }

                return [
                    $key.'_start' => $value->start->toDateString(),
                    $key.'_end' => $value->end?->toDateString(),
                ];
            }
        };
    }
}
