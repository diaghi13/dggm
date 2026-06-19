<?php

use App\Domains\Quote\Models\Quote;
use App\Domains\Quote\Models\QuoteItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\SettingSeeder::class);
});

describe('Quote Item Billing Units', function () {
    it('billing_unit unit calculates qty × price', function () {
        $quote = Quote::factory()->create(['discount_percentage' => 0]);

        $item = QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => 'item',
            'quantity' => 3,
            'unit_price' => 100,
            'billing_unit' => 'unit',
            'duration' => null,

            'vat_rate' => 0,
            'discount_percentage' => 0,
        ]);

        $item->refresh();
        expect((float) $item->subtotal)->toEqual(300.00);
    });

    it('billing_unit flat uses only the price regardless of qty', function () {
        $quote = Quote::factory()->create(['discount_percentage' => 0]);

        $item = QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => 'item',
            'quantity' => 5,
            'unit_price' => 200,
            'billing_unit' => 'flat',
            'duration' => null,

            'vat_rate' => 0,
            'discount_percentage' => 0,
        ]);

        $item->refresh();
        expect((float) $item->subtotal)->toEqual(200.00);
    });

    it('billing_unit day 5gg calculates qty × price × curve(5)', function () {
        // Power-Decay: 2 × 50 × curve(5) ≈ 2 × 50 × 2.797 ≈ 279.7
        $quote = Quote::factory()->create(['discount_percentage' => 0]);

        $item = QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => 'item',
            'quantity' => 2,
            'unit_price' => 50,
            'billing_unit' => 'day',
            'duration' => 5,
            'vat_rate' => 0,
            'discount_percentage' => 0,
        ]);

        $item->refresh();
        expect((float) $item->subtotal)->toBeGreaterThan(279.0);
        expect((float) $item->subtotal)->toBeLessThan(281.0);
    });

    it('billing_unit day 7gg calculates qty × price × curve(7)', function () {
        // Power-Decay: curve(7) ≈ 3.39× (range accettabile 3.2–4.0×)
        $quote = Quote::factory()->create(['discount_percentage' => 0]);

        $item = QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => 'item',
            'quantity' => 1,
            'unit_price' => 100,
            'billing_unit' => 'day',
            'duration' => 7,
            'vat_rate' => 0,
            'discount_percentage' => 0,
        ]);

        $item->refresh();
        // curve(7) ≈ 3.39 → 100 × 3.39 = 339 (range 3.2–4.0× ✓)
        expect((float) $item->subtotal)->toBeGreaterThan(320.0);
        expect((float) $item->subtotal)->toBeLessThan(400.0);
    });

    it('billing_unit day 50gg calculates qty × price × curve(50)', function () {
        // Power-Decay: curve(50) ≈ 10.4× → 100 × 10.4 ≈ 1040
        $quote = Quote::factory()->create(['discount_percentage' => 0]);

        $item = QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => 'item',
            'quantity' => 1,
            'unit_price' => 100,
            'billing_unit' => 'day',
            'duration' => 50,
            'vat_rate' => 0,
            'discount_percentage' => 0,
        ]);

        $item->refresh();
        // curve(50) ≈ 10.4× → 100 × 10.4 ≈ 1040
        expect((float) $item->subtotal)->toBeGreaterThan(1000.0);
        expect((float) $item->subtotal)->toBeLessThan(1100.0);
    });

    it('duration inherits from quote.event_days when item duration is null', function () {
        // quote.event_days = 7 → item senza duration usa 7gg → curve(7) ≈ 3.39×
        $quote = Quote::factory()->create([
            'discount_percentage' => 0,
            'event_days' => 7,
        ]);

        $item = QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => 'item',
            'quantity' => 1,
            'unit_price' => 100,
            'billing_unit' => 'day',
            'duration' => null,
            'vat_rate' => 0,
            'discount_percentage' => 0,
        ]);

        $item->refresh();
        // Stesso risultato di duration=7: 1 × 100 × curve(7) ≈ 338.78
        expect((float) $item->subtotal)->toBeGreaterThan(320.0);
        expect((float) $item->subtotal)->toBeLessThan(400.0);
    });

    it('billing_unit day is monotonically increasing (no cliff at 7gg or 30gg)', function () {
        // Verifica che il prezzo non scenda mai passando da N a N+1 giorni
        $quote = Quote::factory()->create(['discount_percentage' => 0]);

        $prev = null;
        foreach ([5, 6, 7, 8, 29, 30, 31, 32] as $days) {
            $item = QuoteItem::factory()->create([
                'quote_id' => $quote->id,
                'type' => 'item',
                'quantity' => 1,
                'unit_price' => 100,
                'billing_unit' => 'day',
                'duration' => $days,
                'vat_rate' => 0,
                'discount_percentage' => 0,
            ]);
            $item->refresh();
            $subtotal = (float) $item->subtotal;

            if ($prev !== null) {
                expect($subtotal)->toBeGreaterThan($prev);
            }
            $prev = $subtotal;
        }
    });

    it('billing_unit hour calculates qty × price × duration', function () {
        $quote = Quote::factory()->create(['discount_percentage' => 0]);

        $item = QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => 'item',
            'quantity' => 2,
            'unit_price' => 30,
            'billing_unit' => 'hour',
            'duration' => 8,

            'vat_rate' => 0,
            'discount_percentage' => 0,
        ]);

        $item->refresh();
        expect((float) $item->subtotal)->toEqual(480.00); // 2 × 30 × 8
    });

    it('billing_unit week calculates qty × price × duration (linear)', function () {
        $quote = Quote::factory()->create(['discount_percentage' => 0]);

        $item = QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => 'item',
            'quantity' => 3,
            'unit_price' => 50,
            'billing_unit' => 'week',
            'duration' => 2,
            'vat_rate' => 0,
            'discount_percentage' => 0,
        ]);

        $item->refresh();
        expect((float) $item->subtotal)->toEqual(300.00); // 3 × 50 × 2
    });

    it('billing_unit month calculates qty × price × duration (linear)', function () {
        $quote = Quote::factory()->create(['discount_percentage' => 0]);

        $item = QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => 'item',
            'quantity' => 1,
            'unit_price' => 200,
            'billing_unit' => 'month',
            'duration' => 3,
            'vat_rate' => 0,
            'discount_percentage' => 0,
        ]);

        $item->refresh();
        expect((float) $item->subtotal)->toEqual(600.00); // 1 × 200 × 3
    });
});

describe('Quote Total Calculations', function () {
    it('calculates quote totals correctly', function () {
        $quote = Quote::factory()->create([
            'discount_percentage' => 0,
        ]);

        QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => 'item',
            'quantity' => 2,
            'unit_price' => 100,
            'vat_rate' => 22,
            'discount_percentage' => 0,
        ]);

        QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => 'item',
            'quantity' => 1,
            'unit_price' => 50,
            'vat_rate' => 22,
            'discount_percentage' => 0,
        ]);

        // Quote totals are automatically calculated in QuoteItem's saved event
        $quote->refresh();

        expect($quote->subtotal)->toEqual(250.00);
        expect($quote->discount_amount)->toEqual(0.00);
        expect($quote->tax_amount)->toBeGreaterThan(0);
        expect($quote->total_amount)->toBeGreaterThan(250.00);
    });

    it('applies discount percentage correctly', function () {
        $quote = Quote::factory()->create([
            'discount_percentage' => 10,
        ]);

        QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => 'item',
            'quantity' => 1,
            'unit_price' => 100,
            'vat_rate' => 22,
            'discount_percentage' => 0,
        ]);

        $quote->refresh();

        expect($quote->subtotal)->toEqual(100.00);
        expect($quote->discount_amount)->toEqual(10.00);
        // Imponibile = subtotal - discount = 90
        // IVA 22% su 90 = 19.80
        // Total = 90 + 19.80 = 109.80
        expect($quote->total_amount)->toEqual(109.80);
    });

    it('calculates deposit amount when deposit percentage is set', function () {
        $quote = Quote::factory()->create([
            'deposit_percentage' => 50,
            'discount_percentage' => 0,
        ]);

        QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => 'item',
            'quantity' => 10,
            'unit_price' => 100,
            'vat_rate' => 22,
            'discount_percentage' => 0,
        ]);

        $quote->refresh();

        expect($quote->deposit_percentage)->toEqual(50.00);
        expect($quote->deposit_amount)->toBeGreaterThan(0);
        expect($quote->deposit_amount)->toBeLessThanOrEqual($quote->total_amount);
    });

    it('handles zero deposit percentage', function () {
        $quote = Quote::factory()->create([
            'deposit_percentage' => 0,
            'discount_percentage' => 0,
        ]);

        QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => 'item',
            'quantity' => 1,
            'unit_price' => 100,
            'vat_rate' => 22,
            'discount_percentage' => 0,
        ]);

        $quote->refresh();

        expect($quote->deposit_amount)->toEqual(0.00);
    });

    it('ignores section items in total calculations', function () {
        $quote = Quote::factory()->create(['discount_percentage' => 0]);

        QuoteItem::factory()->section()->create([
            'quote_id' => $quote->id,
            'description' => 'Section Title',
        ]);

        QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => 'item',
            'quantity' => 1,
            'unit_price' => 100,
            'vat_rate' => 22,
            'discount_percentage' => 0,
        ]);

        $quote->refresh();

        expect($quote->subtotal)->toEqual(100.00);
    });

    it('sums VAT from all items correctly', function () {
        $quote = Quote::factory()->create([
            'discount_percentage' => 0,
        ]);

        // Item 1: 100€ + 22% VAT = 22€
        QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => 'item',
            'quantity' => 1,
            'unit_price' => 100,
            'vat_rate' => 22,
            'discount_percentage' => 0,
        ]);

        // Item 2: 50€ + 22% VAT = 11€
        QuoteItem::factory()->create([
            'quote_id' => $quote->id,
            'type' => 'item',
            'quantity' => 1,
            'unit_price' => 50,
            'vat_rate' => 22,
            'discount_percentage' => 0,
        ]);

        $quote->refresh();

        // Total VAT: 100×22% + 50×22% = 22 + 11 = 33
        expect((float) $quote->tax_amount)->toEqual(33.00);
        // Total amount: subtotal(150) + tax(33) = 183
        expect((float) $quote->total_amount)->toEqual(183.00);
    });
});

describe('Quote State Methods', function () {
    it('identifies editable quotes correctly', function () {
        $draft = Quote::factory()->draft()->create();
        $sent = Quote::factory()->sent()->create();
        $approved = Quote::factory()->approved()->create();
        $rejected = Quote::factory()->rejected()->create();

        expect($draft->canBeEdited())->toBeTrue();
        expect($sent->canBeEdited())->toBeTrue();
        expect($approved->canBeEdited())->toBeFalse();
        expect($rejected->canBeEdited())->toBeFalse();
    });

    it('identifies approvable quotes correctly', function () {
        $draft = Quote::factory()->draft()->create();
        $sent = Quote::factory()->sent()->create();
        $approved = Quote::factory()->approved()->create();

        expect($draft->canBeApproved())->toBeFalse();
        expect($sent->canBeApproved())->toBeTrue();
        expect($approved->canBeApproved())->toBeFalse();
    });

    it('approves quote correctly', function () {
        $quote = Quote::factory()->sent()->create();

        expect($quote->status)->toBe('sent');
        expect($quote->approved_date)->toBeNull();

        $quote->approve();

        expect($quote->status)->toBe('approved');
        expect($quote->approved_date)->not->toBeNull();
    });

    it('rejects quote correctly', function () {
        $quote = Quote::factory()->sent()->create();

        $quote->reject();

        expect($quote->status)->toBe('rejected');
    });

    it('sends quote correctly', function () {
        $quote = Quote::factory()->draft()->create();

        expect($quote->sent_date)->toBeNull();

        $quote->send();

        expect($quote->status)->toBe('sent');
        expect($quote->sent_date)->not->toBeNull();
    });
});

describe('Quote Code Generation', function () {
    it('auto-generates quote code on creation', function () {
        $quote = Quote::factory()->create(['code' => null]);

        expect($quote->code)->not->toBeNull();
        expect($quote->code)->toStartWith('PREV-'.now()->format('Y'));
    });

    it('does not override provided code', function () {
        $customCode = 'CUSTOM-001';
        $quote = Quote::factory()->create(['code' => $customCode]);

        expect($quote->code)->toBe($customCode);
    });

    it('generates sequential codes for same year', function () {
        $quote1 = Quote::factory()->create(['code' => null]);
        $quote2 = Quote::factory()->create(['code' => null]);

        expect($quote1->code)->not->toBe($quote2->code);
        expect($quote1->code)->toStartWith('PREV-'.now()->format('Y'));
        expect($quote2->code)->toStartWith('PREV-'.now()->format('Y'));
    });
});

describe('Quote Conversion to Project', function () {
    it('converts approved quote to project', function () {
        $quote = Quote::factory()->approved()->create();

        $project = $quote->convertToProject();

        expect($project)->not->toBeNull();
        expect($project->quote_id)->toBe($quote->id);
        expect($project->customer_id)->toBe($quote->customer_id);
        expect($project->name)->toBe($quote->title);
        expect($project->status)->toBe('planned');
    });

    it('does not convert non-approved quote', function () {
        $quote = Quote::factory()->draft()->create();

        $project = $quote->convertToProject();

        expect($project)->toBeNull();
    });

    it('updates quote with project_id after conversion', function () {
        $quote = Quote::factory()->approved()->create();

        expect($quote->project_id)->toBeNull();

        $project = $quote->convertToProject();

        $quote->refresh();
        expect($quote->project_id)->toBe($project->id);
    });
});

describe('Quote Attributes', function () {
    it('formats full address correctly', function () {
        $quote = Quote::factory()->create([
            'address' => 'Via Roma 1',
            'postal_code' => '20100',
            'city' => 'Milano',
            'province' => 'MI',
        ]);

        expect($quote->full_address)->toContain('Via Roma 1');
        expect($quote->full_address)->toContain('Milano');
        expect($quote->full_address)->toContain('MI');
    });

    it('handles missing address parts', function () {
        $quote = Quote::factory()->create([
            'address' => 'Via Roma 1',
            'city' => 'Milano',
            'province' => null,
            'postal_code' => null,
        ]);

        $fullAddress = $quote->full_address;
        expect($fullAddress)->toContain('Via Roma 1');
        expect($fullAddress)->toContain('Milano');
    });
});
