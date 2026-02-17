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
            'quote' => $this->settingService->get('quotes.code_prefix', 'PREV'),
            'product' => $this->settingService->get('products.code_prefix', 'PRD'),
            'ddt' => $this->settingService->get('warehouse.ddt_code_prefix', 'DDT'),
            'movement' => $this->settingService->get('warehouse.movement_code_prefix', 'MOV'),
            'site' => $this->settingService->get('sites.code_prefix', 'CANT'),
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
            'site' => $this->settingService->get('sites.code_format', '{prefix}-{number:4}'),
            'supplier' => $this->settingService->get('codes.supplier_format', '{prefix}-{number:5}'),
            'worker' => $this->settingService->get('codes.worker_format', '{prefix}-{number:5}'),
            'contractor' => $this->settingService->get('codes.contractor_format', '{prefix}-{number:5}'),
            default => '{prefix}-{number:4}',
        };
    }

    /**
     * Parse format string and replace placeholders
     */
    private function parseFormat(string $format, string $prefix, string $entity, array $context): string
    {
        $replacements = [
            '{prefix}' => $prefix,
            '{year}' => $context['year'] ?? now()->format('Y'),
            '{date}' => $context['date'] ?? now()->format('Ymd'),
        ];

        $code = str_replace(array_keys($replacements), array_values($replacements), $format);

        // Handle {number:X} placeholder
        if (preg_match('/{number:(\d+)}/', $code, $matches)) {
            $padding = (int) $matches[1];
            $number = $this->getNextNumber($entity, $context);
            $code = preg_replace('/{number:\d+}/', str_pad($number, $padding, '0', STR_PAD_LEFT), $code);
        }

        return $code;
    }

    /**
     * Get next sequential number for entity
     * Uses database count to determine next number
     */
    private function getNextNumber(string $entity, array $context): int
    {
        $modelClass = $this->getModelClass($entity);

        if (! $modelClass) {
            return 1;
        }

        $query = $modelClass::query();

        // Apply year/date filters based on context
        if (isset($context['year'])) {
            $query->whereYear('created_at', $context['year']);
        } elseif (isset($context['date'])) {
            // Convert Ymd format to Y-m-d for proper date comparison
            $date = $context['date'];
            if (strlen($date) === 8 && is_numeric($date)) {
                // Format: Ymd (20260211) -> Y-m-d (2026-02-11)
                $date = substr($date, 0, 4).'-'.substr($date, 4, 2).'-'.substr($date, 6, 2);
            }
            $query->whereDate('created_at', $date);
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
            'site' => \App\Models\Site::class,
            'supplier' => \App\Models\Supplier::class,
            'worker' => \App\Models\Worker::class,
            'contractor' => \App\Models\Contractor::class,
            default => null,
        };
    }
}
