<?php

namespace App\Services;

class CodeGeneratorService
{
    public function __construct(
        private readonly SettingService $settingService
    ) {}

    /**
     * Generate code for entity
     *
     * @param  string  $entity  Entity name (quote, product, supplier, etc.)
     * @param  array  $context  Optional context (year, date, custom data)
     * @return string Generated code
     */
    public function generate(string $entity, array $context = []): string
    {
        $prefix = $this->getPrefix($entity);
        $format = $this->getFormat($entity);

        // Parse format placeholders: {prefix}, {year}, {date}, {number:5}
        return $this->parseFormat($format, $prefix, $entity, $context);
    }

    /**
     * Get prefix for entity from settings
     */
    private function getPrefix(string $entity): string
    {
        return match ($entity) {
            'quote' => strtoupper((string) ($this->settingService->get('quotes.code_prefix', 'PREV') ?: 'PREV')),
            'product' => $this->settingService->get('products.code_prefix', 'PRD'),
            'ddt' => $this->settingService->get('warehouse.ddt_code_prefix', 'DDT'),
            'movement' => $this->settingService->get('warehouse.movement_code_prefix', 'MOV'),
            'project' => $this->settingService->get('projects.code_prefix', 'PROG'),
            'supplier' => $this->settingService->get('codes.supplier_prefix', 'FOR'),
            'worker' => $this->settingService->get('codes.worker_prefix', 'LAV'),
            'contractor' => $this->settingService->get('codes.contractor_prefix', 'CON'),
            default => 'CODE',
        };
    }

    /**
     * Get format string for entity from settings
     */
    private function getFormat(string $entity): string
    {
        return match ($entity) {
            'quote' => $this->settingService->get('quotes.code_format', '{prefix}-{year}-{number:4}'),
            'product' => $this->settingService->get('products.code_format', '{prefix}-{number:5}'),
            'ddt' => $this->settingService->get('warehouse.ddt_code_format', '{prefix}-{year}-{number:4}'),
            'movement' => $this->settingService->get('warehouse.movement_code_format', '{prefix}-{date}-{number:3}'),
            'project' => $this->settingService->get('projects.code_format', '{prefix}-{number:4}'),
            'supplier' => $this->settingService->get('codes.supplier_format', '{prefix}-{number:5}'),
            'worker' => $this->settingService->get('codes.worker_format', '{prefix}-{number:5}'),
            'contractor' => $this->settingService->get('codes.contractor_format', '{prefix}-{number:5}'),
            default => '{prefix}-{number:4}',
        };
    }

    /**
     * Parse format string and replace placeholders.
     *
     * Supported placeholders:
     *   {prefix}       → configured prefix (e.g. PREV)
     *   {year}         → 4-digit year (e.g. 2026)
     *   {year:2}       → 2-digit year (e.g. 26)
     *   {month}        → 2-digit month (e.g. 02)
     *   {day}          → 2-digit day (e.g. 17)
     *   {date}         → compact date Ymd (e.g. 20260217)
     *   {number:N}     → sequential counter zero-padded to N digits, resets yearly
     *   {number:N:monthly} → sequential counter that resets monthly
     */
    private function parseFormat(string $format, string $prefix, string $entity, array $context): string
    {
        $now = now();
        $replacements = [
            '{prefix}' => $prefix,
            '{year}' => $context['year'] ?? $now->format('Y'),
            '{year:2}' => $now->format('y'),
            '{month}' => $now->format('m'),
            '{day}' => $now->format('d'),
            '{date}' => $context['date'] ?? $now->format('Ymd'),
        ];

        $code = str_replace(array_keys($replacements), array_values($replacements), $format);

        // Handle {number:N} — yearly counter (default)
        if (preg_match('/{number:(\d+)}/', $code, $matches)) {
            $padding = (int) $matches[1];
            $number = $this->getNextNumber($entity, array_merge($context, ['reset' => 'yearly']));
            $code = preg_replace('/{number:\d+}/', str_pad($number, $padding, '0', STR_PAD_LEFT), $code);
        }

        // Handle {number:N:monthly} — monthly counter
        if (preg_match('/{number:(\d+):monthly}/', $code, $matches)) {
            $padding = (int) $matches[1];
            $number = $this->getNextNumber($entity, array_merge($context, ['reset' => 'monthly']));
            $code = preg_replace('/{number:\d+:monthly}/', str_pad($number, $padding, '0', STR_PAD_LEFT), $code);
        }

        return $code;
    }

    /**
     * Get next sequential number for entity.
     * Context key 'reset' controls the counter scope:
     *   'yearly'  (default) → count resets each calendar year
     *   'monthly'           → count resets each calendar month
     *   'daily'             → count resets each day
     *   'global'            → never resets (lifetime counter)
     */
    private function getNextNumber(string $entity, array $context): int
    {
        $modelClass = $this->getModelClass($entity);

        if (! $modelClass) {
            return 1;
        }

        $query = $modelClass::query();
        $now = now();
        $reset = $context['reset'] ?? 'yearly';

        switch ($reset) {
            case 'monthly':
                $query->whereYear('created_at', $now->year)
                    ->whereMonth('created_at', $now->month);
                break;

            case 'daily':
                $query->whereDate('created_at', $now->toDateString());
                break;

            case 'global':
                // No date filter — lifetime counter
                break;

            case 'yearly':
            default:
                $year = $context['year'] ?? $now->year;
                $query->whereYear('created_at', $year);
                break;
        }

        return $query->count() + 1;
    }

    /**
     * Get model class for entity
     */
    private function getModelClass(string $entity): ?string
    {
        return match ($entity) {
            'quote' => \App\Models\Quote::class,
            'product' => \App\Models\Product::class,
            'ddt' => \App\Models\Ddt::class,
            'movement' => \App\Models\StockMovement::class,
            'project' => \App\Models\Project::class,
            'supplier' => \App\Models\Supplier::class,
            'worker' => \App\Models\Worker::class,
            'contractor' => \App\Models\Contractor::class,
            default => null,
        };
    }
}
