<?php

use App\Models\Quote;
use App\Models\QuoteItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\SettingSeeder::class);
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

        // Total VAT should be 22 + 11 = 33
        expect($quote->tax_amount)->toBeGreaterThan(30);
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
        expect($quote->code)->toStartWith('Q-'.now()->format('Y'));
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
        expect($quote1->code)->toStartWith('Q-'.now()->format('Y'));
        expect($quote2->code)->toStartWith('Q-'.now()->format('Y'));
    });
});

describe('Quote Conversion to Site', function () {
    it('converts approved quote to site', function () {
        $quote = Quote::factory()->approved()->create();

        $site = $quote->convertToSite();

        expect($site)->not->toBeNull();
        expect($site->quote_id)->toBe($quote->id);
        expect($site->customer_id)->toBe($quote->customer_id);
        expect($site->name)->toBe($quote->title);
        expect($site->status)->toBe('planned');
    });

    it('does not convert non-approved quote', function () {
        $quote = Quote::factory()->draft()->create();

        $site = $quote->convertToSite();

        expect($site)->toBeNull();
    });

    it('updates quote with site_id after conversion', function () {
        $quote = Quote::factory()->approved()->create();

        expect($quote->site_id)->toBeNull();

        $site = $quote->convertToSite();

        $quote->refresh();
        expect($quote->site_id)->toBe($site->id);
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
