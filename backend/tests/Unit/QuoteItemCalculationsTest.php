<?php

use App\Domains\Quote\Models\Quote;
use App\Domains\Quote\Models\QuoteItem;
use App\Enums\QuoteItemType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\SettingSeeder::class);
});

describe('QuoteItem Basic Calculations', function () {
    it('calculates item subtotal correctly', function () {
        $item = QuoteItem::factory()->create([
            'type' => QuoteItemType::Item,
            'quantity' => 5,
            'unit_price' => 100,
            'discount_percentage' => 0,
        ]);

        expect($item->subtotal)->toEqual(500.00);
    });

    it('calculates item total with discount', function () {
        $item = QuoteItem::factory()->create([
            'type' => QuoteItemType::Item,
            'quantity' => 5,
            'unit_price' => 100,
            'discount_percentage' => 10,
        ]);

        $item->calculateTotal();

        expect($item->subtotal)->toEqual(500.00);
        expect($item->discount_amount)->toEqual(50.00);
        expect($item->total)->toEqual(450.00);
    });

    it('calculates VAT correctly', function () {
        $quote = Quote::factory()->create(['discount_percentage' => 0]);

        $item = QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => QuoteItemType::Item,
            'quantity' => 1,
            'unit_price' => 100,
            'vat_rate' => 22,
            'discount_percentage' => 0,
        ]);

        $item->calculateTotal();

        expect($item->vat_amount)->toEqual(22.00);
        expect($item->total_with_vat)->toEqual(122.00);
    });

    it('uses default VAT rate when not specified', function () {
        $quote = Quote::factory()->create(['discount_percentage' => 0]);

        $item = QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => QuoteItemType::Item,
            'quantity' => 1,
            'unit_price' => 100,
            'vat_rate' => null,
            'discount_percentage' => 0,
        ]);

        $item->calculateTotal();

        // Default VAT rate is 22% from SettingSeeder
        expect($item->vat_amount)->toBeGreaterThan(0);
    });

    it('handles zero quantity', function () {
        $item = QuoteItem::factory()->create([
            'type' => QuoteItemType::Item,
            'quantity' => 0,
            'unit_price' => 100,
        ]);

        $item->calculateTotal();

        expect($item->subtotal)->toEqual(0.00);
        expect($item->total)->toEqual(0.00);
        expect($item->vat_amount)->toEqual(0.00);
    });

    it('handles zero unit price', function () {
        $item = QuoteItem::factory()->create([
            'type' => QuoteItemType::Item,
            'quantity' => 5,
            'unit_price' => 0,
        ]);

        $item->calculateTotal();

        expect($item->subtotal)->toEqual(0.00);
        expect($item->total)->toEqual(0.00);
    });
});

describe('QuoteItem Section Handling', function () {
    it('sections have zero prices', function () {
        $item = QuoteItem::factory()->section()->create([
            'description' => 'Section Title',
        ]);

        $item->calculateTotal();

        expect($item->subtotal)->toEqual(0.00);
        expect($item->total)->toEqual(0.00);
        expect($item->vat_amount)->toEqual(0.00);
        expect($item->total_with_vat)->toEqual(0.00);
    });

    it('identifies sections correctly', function () {
        $section = QuoteItem::factory()->section()->create();
        $item = QuoteItem::factory()->create(['type' => QuoteItemType::Item]);

        expect($section->isSection())->toBeTrue();
        expect($item->isSection())->toBeFalse();
    });
});

describe('QuoteItem Discount Calculations', function () {
    it('applies item discount before quote discount', function () {
        $quote = Quote::factory()->create(['discount_percentage' => 10]);

        $item = QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => QuoteItemType::Item,
            'quantity' => 1,
            'unit_price' => 100,
            'discount_percentage' => 20,
            'vat_rate' => 22,
        ]);

        $item->calculateTotal();

        // Item discount: 100 - 20% = 80
        expect($item->subtotal)->toEqual(100.00);
        expect($item->discount_amount)->toEqual(20.00);
        expect($item->total)->toEqual(80.00);

        // Quote discount then applied on 80: 80 - 10% = 72
        // VAT on 72: 72 * 22% = 15.84
        expect($item->vat_amount)->toBeGreaterThan(15);
        expect($item->vat_amount)->toBeLessThan(18);
    });

    it('handles 100% discount', function () {
        $item = QuoteItem::factory()->create([
            'type' => QuoteItemType::Item,
            'quantity' => 1,
            'unit_price' => 100,
            'discount_percentage' => 100,
        ]);

        $item->calculateTotal();

        expect($item->discount_amount)->toEqual(100.00);
        expect($item->total)->toEqual(0.00);
        expect($item->vat_amount)->toEqual(0.00);
    });

    it('handles no discount', function () {
        $quote = Quote::factory()->create(['discount_percentage' => 0]);

        $item = QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => QuoteItemType::Item,
            'quantity' => 1,
            'unit_price' => 100,
            'discount_percentage' => 0,
            'vat_rate' => 22,
        ]);

        $item->calculateTotal();

        expect($item->discount_amount)->toEqual(0.00);
        expect($item->total)->toEqual(100.00);
        expect($item->vat_amount)->toEqual(22.00);
    });
});

describe('QuoteItem Types', function () {
    it('calculates labor items correctly', function () {
        $item = QuoteItem::factory()->labor()->create([
            'quantity' => 8,
            'unit_price' => 50,
            'vat_rate' => 22,
        ]);

        $item->calculateTotal();

        expect($item->subtotal)->toEqual(400.00);
        expect($item->unit)->toBe('h');
    });

    it('calculates material items correctly', function () {
        $item = QuoteItem::factory()->material()->create([
            'quantity' => 10,
            'unit_price' => 25,
            'vat_rate' => 22,
        ]);

        $item->calculateTotal();

        expect($item->subtotal)->toEqual(250.00);
        expect($item->type)->toBe(QuoteItemType::Material);
    });

    it('calculates regular items correctly', function () {
        $item = QuoteItem::factory()->create([
            'type' => QuoteItemType::Item,
            'quantity' => 3,
            'unit_price' => 100,
            'vat_rate' => 22,
        ]);

        $item->calculateTotal();

        expect($item->subtotal)->toEqual(300.00);
    });
});

describe('QuoteItem Recalculation on Quote Update', function () {
    it('recalculates quote totals when item is created', function () {
        $quote = Quote::factory()->create();

        expect($quote->total_amount)->toEqual(0.00);

        QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'quantity' => 1,
            'unit_price' => 100,
            'vat_rate' => 22,
        ]);

        $quote->refresh();
        expect($quote->total_amount)->toBeGreaterThan(0);
    });

    it('recalculates quote totals when item is updated', function () {
        $quote = Quote::factory()->create();

        $item = QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'quantity' => 1,
            'unit_price' => 100,
            'vat_rate' => 22,
        ]);

        $initialTotal = $quote->fresh()->total_amount;

        $item->update(['quantity' => 2]);

        $quote->refresh();
        expect($quote->total_amount)->toBeGreaterThan($initialTotal);
    });

    it('recalculates quote totals when item is deleted', function () {
        $quote = Quote::factory()->create();

        $item = QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'quantity' => 1,
            'unit_price' => 100,
            'vat_rate' => 22,
        ]);

        expect($quote->fresh()->total_amount)->toBeGreaterThan(0);

        $item->delete();

        $quote->refresh();
        expect($quote->total_amount)->toEqual(0.00);
    });
});

describe('QuoteItem Edge Cases', function () {
    it('handles very large quantities', function () {
        $item = QuoteItem::factory()->create([
            'type' => QuoteItemType::Item,
            'quantity' => 10000,
            'unit_price' => 1.50,
        ]);

        $item->calculateTotal();

        expect($item->subtotal)->toEqual(15000.00);
    });

    it('handles decimal quantities', function () {
        $item = QuoteItem::factory()->create([
            'type' => QuoteItemType::Item,
            'quantity' => 2.5,
            'unit_price' => 100,
        ]);

        $item->calculateTotal();

        expect($item->subtotal)->toEqual(250.00);
    });

    it('handles decimal prices', function () {
        $item = QuoteItem::factory()->create([
            'type' => QuoteItemType::Item,
            'quantity' => 3,
            'unit_price' => 33.33,
        ]);

        $item->calculateTotal();

        expect($item->subtotal)->toEqual(99.99);
    });

    it('handles multiple VAT rates', function () {
        $quote = Quote::factory()->create(['discount_percentage' => 0]);

        $item1 = QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'quantity' => 1,
            'unit_price' => 100,
            'vat_rate' => 22,
        ]);

        $item2 = QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'quantity' => 1,
            'unit_price' => 100,
            'vat_rate' => 10,
        ]);

        $item1->calculateTotal();
        $item2->calculateTotal();

        expect($item1->vat_amount)->toEqual(22.00);
        expect($item2->vat_amount)->toEqual(10.00);
    });
});
