<?php

namespace App\Actions\Quote;

use App\Data\QuoteData;
use App\Events\QuoteCreated;
use App\Models\Quote;
use App\Models\Setting;
use App\Services\QuoteTermsService;
use Illuminate\Support\Facades\DB;

class CreateQuoteAction
{
    public function __construct(
        private readonly QuoteTermsService $termsService
    ) {}

    public function execute(QuoteData $data): Quote
    {
        return DB::transaction(function () use ($data) {
            $quoteArray = $data->except('id', 'items', 'customer', 'projectManager', 'priceList', 'paymentTerm', 'warrantyType', 'project', 'full_address')->toArray();
            $quoteArray = $this->applySettingDefaults($quoteArray);
            $quote = Quote::create($quoteArray);

            // Create items if provided (with hierarchy support)
            if ($data->items instanceof \Spatie\LaravelData\DataCollection) {
                foreach ($data->items as $itemData) {
                    $this->createItemWithChildren($quote, $itemData);
                }
            }

            // Recalculate totals
            $quote->calculateTotals();

            // Create deposits if provided
            if ($data->deposits instanceof \Spatie\LaravelData\DataCollection) {
                foreach ($data->deposits as $depositData) {
                    $arr = $depositData->except('id')->toArray();
                    if (! $depositData->is_fixed_amount && $depositData->percentage !== null) {
                        $arr['amount'] = round(($quote->total_amount * $depositData->percentage) / 100, 2);
                    }
                    $quote->deposits()->create($arr);
                }
            }

            // Resolve placeholders in terms_and_conditions now that totals are available
            if (! empty($quote->terms_and_conditions)) {
                $resolved = $this->termsService->resolvePlaceholders($quote->terms_and_conditions, $quote);
                if ($resolved !== $quote->terms_and_conditions) {
                    $quote->terms_and_conditions = $resolved;
                    $quote->saveQuietly();
                }
            }

            // Dispatch event
            QuoteCreated::dispatch($quote, [
                'user_id' => auth()->id(),
                'ip_address' => request()->ip(),
            ]);

            return $quote->fresh(['items.children', 'customer', 'projectManager', 'priceList', 'paymentTerm', 'warrantyType', 'deposits']);
        });
    }

    /**
     * Apply quote setting defaults for null/unset fields.
     * Only overrides fields that were not explicitly provided.
     */
    private function applySettingDefaults(array $data): array
    {
        $booleanDefaults = [
            'show_unit_prices' => 'quotes.show_unit_prices_by_default',
            'show_product_codes' => 'quotes.show_product_codes_by_default',
            'show_vat' => 'quotes.show_vat_by_default',
            'show_section_totals' => 'quotes.show_section_totals_by_default',
            'vat_included_in_prices' => 'quotes.vat_included_in_prices_by_default',
            'tax_included' => 'quotes.tax_included_by_default',
            'include_terms_and_conditions' => 'quotes.include_terms_and_conditions_by_default',
        ];

        foreach ($booleanDefaults as $field => $settingKey) {
            if (! isset($data[$field]) || $data[$field] === null) {
                $value = Setting::get($settingKey);
                if ($value !== null) {
                    $data[$field] = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                }
            }
        }

        // Apply default notes if not set
        if (empty($data['notes'])) {
            $defaultNotes = Setting::get('quotes.default_notes');
            if ($defaultNotes) {
                $data['notes'] = $defaultNotes;
            }
        }

        // Apply default terms if not set
        if (empty($data['terms_and_conditions'])) {
            $template = Setting::get('quotes.terms_and_conditions_template');
            if ($template) {
                $data['terms_and_conditions'] = $template;
            }
        }

        // Apply expiry_date from default_validity_days if not set
        if (empty($data['expiry_date']) && ! empty($data['issue_date'])) {
            $days = (int) (Setting::get('quotes.default_validity_days', 30) ?: 30);
            if ($days > 0) {
                $issueDate = is_string($data['issue_date'])
                    ? \Carbon\Carbon::parse($data['issue_date'])
                    : $data['issue_date'];
                $data['expiry_date'] = $issueDate->addDays($days)->format('Y-m-d');
            }
        }

        return $data;
    }

    /**
     * Recursively create item with children
     */
    private function createItemWithChildren(Quote $quote, $itemData, ?int $parentId = null): void
    {
        // Create the item
        $item = $quote->items()->create([
            ...$itemData->except('id', 'product', 'priceListItem', 'parent', 'children')->toArray(),
            'parent_id' => $parentId,
        ]);

        // Create children recursively
        if (isset($itemData->children) && $itemData->children instanceof \Spatie\LaravelData\DataCollection) {
            foreach ($itemData->children as $childData) {
                $this->createItemWithChildren($quote, $childData, $item->id);
            }
        }
    }
}
