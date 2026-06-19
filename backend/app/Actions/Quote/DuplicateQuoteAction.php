<?php

namespace App\Actions\Quote;

use App\Domains\Quote\Models\Quote;
use App\Domains\Quote\Models\QuoteItem;
use App\Events\QuoteDuplicated;
use Illuminate\Support\Facades\DB;

class DuplicateQuoteAction
{
    public function execute(Quote $quote): Quote
    {
        return DB::transaction(function () use ($quote) {
            $newQuote = Quote::create([
                'quote_type' => $quote->quote_type,
                'event_days' => $quote->event_days,
                'title' => $quote->title,
                'customer_id' => $quote->customer_id,
                'project_manager_id' => $quote->project_manager_id,
                'description' => $quote->description,
                'address' => $quote->address,
                'city' => $quote->city,
                'province' => $quote->province,
                'postal_code' => $quote->postal_code,
                'status' => 'draft',
                'issue_date' => now()->format('Y-m-d'),
                'expiry_date' => $quote->expiry_date,
                'price_list_id' => $quote->price_list_id,
                'payment_term_id' => $quote->payment_term_id,
                'financial_resource_id' => $quote->financial_resource_id,
                'payment_method' => $quote->payment_method,
                'payment_terms' => $quote->payment_terms,
                'notes' => $quote->notes,
                'terms_and_conditions' => $quote->terms_and_conditions,
                'footer_text' => $quote->footer_text,
                'template_id' => $quote->template_id,
                'warranty_type_id' => $quote->warranty_type_id,
                'deposit_percentage' => $quote->deposit_percentage,
                'work_start_description' => $quote->work_start_description,
                'work_start_date' => $quote->work_start_date,
                'work_duration_description' => $quote->work_duration_description,
                'work_end_date' => $quote->work_end_date,
                'show_unit_prices' => $quote->show_unit_prices,
                'show_product_codes' => $quote->show_product_codes,
                'show_vat' => $quote->show_vat,
                'show_section_totals' => $quote->show_section_totals,
                'tax_included' => $quote->tax_included,
                'vat_included_in_prices' => $quote->vat_included_in_prices,
                'include_terms_and_conditions' => $quote->include_terms_and_conditions,
                'tax_percentage' => $quote->tax_percentage,
            ]);

            // Copy items recursively (root items first, then their children)
            $rootItems = $quote->items()->with('children')->whereNull('parent_id')->orderBy('sort_order')->get();

            foreach ($rootItems as $rootItem) {
                $this->copyItemWithChildren($newQuote, $rootItem, null);
            }

            $newQuote->calculateTotals();

            QuoteDuplicated::dispatch($newQuote, $quote, [
                'user_id' => auth()->id(),
                'ip_address' => request()->ip(),
            ]);

            return $newQuote->fresh(['items.children', 'customer', 'projectManager', 'priceList', 'paymentTerm', 'warrantyType']);
        });
    }

    private function copyItemWithChildren(Quote $newQuote, QuoteItem $item, ?int $newParentId): void
    {
        $newItem = $newQuote->items()->create([
            'type' => $item->type,
            'code' => $item->code,
            'description' => $item->description,
            'notes' => $item->notes,
            'sort_order' => $item->sort_order,
            'unit' => $item->unit,
            'billing_unit' => $item->billing_unit,
            'duration' => $item->duration,
            'quantity' => $item->quantity,
            'unit_price' => $item->unit_price,
            'cost_price' => $item->cost_price,
            'discount_percentage' => $item->discount_percentage,
            'hide_unit_price' => $item->hide_unit_price,
            'include_image' => $item->include_image,
            'included_media_ids' => $item->included_media_ids,
            'expand_kit' => $item->expand_kit,
            'product_id' => $item->product_id,
            'price_list_item_id' => $item->price_list_item_id,
            'vat_rate' => $item->vat_rate,
            'parent_id' => $newParentId,
        ]);

        foreach ($item->children as $child) {
            $this->copyItemWithChildren($newQuote, $child, $newItem->id);
        }
    }
}
