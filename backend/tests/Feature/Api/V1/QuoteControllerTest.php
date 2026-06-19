<?php

use App\Domains\Customer\Models\Customer;
use App\Domains\Product\Models\Product;
use App\Domains\Quote\Models\Quote;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

use function Pest\Laravel\assertDatabaseHas;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->seed(\Database\Seeders\SettingSeeder::class);

    $this->user = User::factory()->create();
    $this->user->assignRole('project-manager');
    Sanctum::actingAs($this->user);
});

describe('Quote Index', function () {
    it('can list quotes', function () {
        Quote::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/quotes');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'code', 'title', 'status'],
                ],
                'meta',
                'links',
            ]);

        expect($response->json('data'))->toHaveCount(5);
    });

    it('can filter quotes by status', function () {
        Quote::factory()->draft()->create();
        Quote::factory()->sent()->create();
        Quote::factory()->approved()->create();

        $response = $this->getJson('/api/v1/quotes?status=draft');

        $response->assertOk();
        expect($response->json('data'))->toHaveCount(1);
        expect($response->json('data.0.status'))->toBe('draft');
    });

    it('can filter quotes by customer', function () {
        $customer = Customer::factory()->create();
        Quote::factory()->create(['customer_id' => $customer->id]);
        Quote::factory()->count(2)->create();

        $response = $this->getJson("/api/v1/quotes?customer_id={$customer->id}");

        $response->assertOk();
        expect($response->json('data'))->toHaveCount(1);
        expect($response->json('data.0.customer_id'))->toBe($customer->id);
    });

    it('can search quotes by title or code', function () {
        Quote::factory()->create(['title' => 'Test Installation Project']);
        Quote::factory()->create(['title' => 'Other Project']);

        $response = $this->getJson('/api/v1/quotes?search=Installation');

        $response->assertOk();
        expect($response->json('data'))->toHaveCount(1);
    });

    it('requires view permission to list quotes', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/quotes');

        $response->assertForbidden();
    });
});

describe('Quote Store', function () {
    it('can create a new quote', function () {
        $customer = Customer::factory()->create();

        $data = [
            'title' => 'Test Quote',
            'customer_id' => $customer->id,
            'issue_date' => now()->toDateString(),
        ];

        $response = $this->postJson('/api/v1/quotes', $data);

        $response->assertCreated()
            ->assertJson([
                'success' => true,
                'message' => 'Preventivo creato con successo',
            ])
            ->assertJsonStructure([
                'data' => ['id', 'code', 'title', 'status'],
            ]);

        assertDatabaseHas('quotes', [
            'title' => 'Test Quote',
            'customer_id' => $customer->id,
            'status' => 'draft',
        ]);

        expect($response->json('data.code'))->toStartWith('PREV-'.now()->format('Y'));
    });

    it('can create quote with items', function () {
        $customer = Customer::factory()->create();
        $product = Product::factory()->create();

        $data = [
            'title' => 'Quote with Items',
            'customer_id' => $customer->id,
            'issue_date' => now()->toDateString(),
            'items' => [
                [
                    'product_id' => $product->id,
                    'type' => 'item',
                    'description' => 'Test Item',
                    'quantity' => 2,
                    'unit_price' => 100,
                    'vat_rate' => 22,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/quotes', $data);

        $response->assertCreated();

        $quote = Quote::first();
        expect($quote->items)->toHaveCount(1);
        expect($quote->subtotal)->toBeGreaterThan(0);
    });

    it('validates required fields when creating quote', function () {
        $response = $this->postJson('/api/v1/quotes', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'customer_id']);
    });

    it('requires create permission', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/quotes', [
            'title' => 'Test',
            'customer_id' => Customer::factory()->create()->id,
            'issue_date' => now()->toDateString(),
        ]);

        $response->assertForbidden();
    });
});

describe('Quote Show', function () {
    it('can get a single quote', function () {
        $quote = Quote::factory()->create();

        $response = $this->getJson("/api/v1/quotes/{$quote->id}");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $quote->id,
                    'code' => $quote->code,
                    'title' => $quote->title,
                ],
            ]);
    });

    it('returns 404 for non-existent quote', function () {
        $response = $this->getJson('/api/v1/quotes/99999');

        $response->assertNotFound();
    });

    it('requires view permission', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $quote = Quote::factory()->create();
        $response = $this->getJson("/api/v1/quotes/{$quote->id}");

        $response->assertForbidden();
    });
});

describe('Quote Update', function () {
    it('can update a draft quote', function () {
        $quote = Quote::factory()->draft()->create(['title' => 'Old Title']);

        $response = $this->putJson("/api/v1/quotes/{$quote->id}", [
            'title' => 'Updated Title',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Preventivo aggiornato con successo',
            ]);

        expect($quote->fresh()->title)->toBe('Updated Title');
    });

    it('can update a sent quote', function () {
        $quote = Quote::factory()->sent()->create(['title' => 'Old Title']);

        $response = $this->putJson("/api/v1/quotes/{$quote->id}", [
            'title' => 'Updated Title',
        ]);

        $response->assertOk();
        expect($quote->fresh()->title)->toBe('Updated Title');
    });

    it('cannot update an approved quote', function () {
        $quote = Quote::factory()->approved()->create();

        $response = $this->putJson("/api/v1/quotes/{$quote->id}", [
            'title' => 'New Title',
        ]);

        $response->assertForbidden();
    });

    it('cannot update a rejected quote', function () {
        $quote = Quote::factory()->rejected()->create();

        $response = $this->putJson("/api/v1/quotes/{$quote->id}", [
            'title' => 'New Title',
        ]);

        $response->assertForbidden();
    });

    it('requires edit permission', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $quote = Quote::factory()->draft()->create();
        $response = $this->putJson("/api/v1/quotes/{$quote->id}", [
            'title' => 'New Title',
        ]);

        $response->assertForbidden();
    });
});

describe('Quote Delete', function () {
    it('can delete a draft quote', function () {
        $quote = Quote::factory()->draft()->create();

        $response = $this->deleteJson("/api/v1/quotes/{$quote->id}");

        $response->assertNoContent();
        expect($quote->fresh()->trashed())->toBeTrue();
    });

    it('cannot delete a sent quote', function () {
        $quote = Quote::factory()->sent()->create();

        $response = $this->deleteJson("/api/v1/quotes/{$quote->id}");

        $response->assertForbidden();
    });

    it('cannot delete an approved quote', function () {
        $quote = Quote::factory()->approved()->create();

        $response = $this->deleteJson("/api/v1/quotes/{$quote->id}");

        $response->assertForbidden();
    });

    it('requires delete permission', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $quote = Quote::factory()->draft()->create();
        $response = $this->deleteJson("/api/v1/quotes/{$quote->id}");

        $response->assertForbidden();
    });
});

describe('Quote Send', function () {
    it('can send a draft quote', function () {
        $quote = Quote::factory()->draft()->create();

        expect($quote->status)->toBe('draft');
        expect($quote->sent_date)->toBeNull();

        $response = $this->postJson("/api/v1/quotes/{$quote->id}/send");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Preventivo inviato al cliente',
            ]);

        $quote->refresh();
        expect($quote->status)->toBe('sent');
        expect($quote->sent_date)->not->toBeNull();
    });

    it('cannot send an already sent quote', function () {
        $quote = Quote::factory()->sent()->create();

        $response = $this->postJson("/api/v1/quotes/{$quote->id}/send");

        $response->assertForbidden();
    });

    it('cannot send an approved quote', function () {
        $quote = Quote::factory()->approved()->create();

        $response = $this->postJson("/api/v1/quotes/{$quote->id}/send");

        $response->assertForbidden();
    });

    it('requires edit permission to send', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $quote = Quote::factory()->draft()->create();
        $response = $this->postJson("/api/v1/quotes/{$quote->id}/send");

        $response->assertForbidden();
    });
});

describe('Quote Approve', function () {
    it('can approve a sent quote', function () {
        $quote = Quote::factory()->sent()->create();

        expect($quote->status)->toBe('sent');
        expect($quote->approved_date)->toBeNull();

        $response = $this->postJson("/api/v1/quotes/{$quote->id}/approve");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Preventivo approvato con successo',
            ]);

        $quote->refresh();
        expect($quote->status)->toBe('approved');
        expect($quote->approved_date)->not->toBeNull();
    });

    it('cannot approve a draft quote', function () {
        $quote = Quote::factory()->draft()->create();

        $response = $this->postJson("/api/v1/quotes/{$quote->id}/approve");

        $response->assertForbidden();
    });

    it('cannot approve an already approved quote', function () {
        $quote = Quote::factory()->approved()->create();

        $response = $this->postJson("/api/v1/quotes/{$quote->id}/approve");

        $response->assertForbidden();
    });

    it('requires approve permission', function () {
        $user = User::factory()->create();
        $user->givePermissionTo('quotes.view', 'quotes.edit');
        Sanctum::actingAs($user);

        $quote = Quote::factory()->sent()->create();
        $response = $this->postJson("/api/v1/quotes/{$quote->id}/approve");

        $response->assertForbidden();
    });
});

describe('Quote Reject', function () {
    it('can reject a sent quote', function () {
        $quote = Quote::factory()->sent()->create();

        $response = $this->postJson("/api/v1/quotes/{$quote->id}/reject");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Preventivo rifiutato',
            ]);

        expect($quote->fresh()->status)->toBe('rejected');
    });

    it('cannot reject a draft quote', function () {
        $quote = Quote::factory()->draft()->create();

        $response = $this->postJson("/api/v1/quotes/{$quote->id}/reject");

        $response->assertForbidden();
    });

    it('requires approve permission to reject', function () {
        $user = User::factory()->create();
        $user->givePermissionTo('quotes.view', 'quotes.edit');
        Sanctum::actingAs($user);

        $quote = Quote::factory()->sent()->create();
        $response = $this->postJson("/api/v1/quotes/{$quote->id}/reject");

        $response->assertForbidden();
    });
});

describe('Quote Convert to Project', function () {
    it('can convert approved quote to project', function () {
        $quote = Quote::factory()->approved()->create();

        expect($quote->project_id)->toBeNull();

        $response = $this->postJson("/api/v1/quotes/{$quote->id}/convert-to-project");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Preventivo convertito in progetto con successo',
            ])
            ->assertJsonStructure([
                'data' => ['quote', 'project_id'],
            ]);

        $quote->refresh();
        expect($quote->project_id)->not->toBeNull();

        assertDatabaseHas('projects', [
            'id' => $quote->project_id,
            'quote_id' => $quote->id,
            'customer_id' => $quote->customer_id,
        ]);
    });

    it('cannot convert non-approved quote', function () {
        $quote = Quote::factory()->sent()->create();

        $response = $this->postJson("/api/v1/quotes/{$quote->id}/convert-to-project");

        $response->assertForbidden();
    });

    it('cannot convert already converted quote', function () {
        $quote = Quote::factory()->approved()->create();
        $quote->convertToProject();

        $response = $this->postJson("/api/v1/quotes/{$quote->id}/convert-to-project");

        $response->assertForbidden();
    });

    it('requires convert permission', function () {
        $user = User::factory()->create();
        $user->givePermissionTo('quotes.view', 'quotes.edit', 'quotes.approve');
        Sanctum::actingAs($user);

        $quote = Quote::factory()->approved()->create();
        $response = $this->postJson("/api/v1/quotes/{$quote->id}/convert-to-project");

        $response->assertForbidden();
    });
});

describe('Quote PDF', function () {
    it('can generate and save PDF', function () {
        $quote = Quote::factory()->create();

        $response = $this->postJson("/api/v1/quotes/{$quote->id}/save-pdf");

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => ['pdf_url', 'file_name'],
                'message',
            ]);
    });

    it('can download PDF', function () {
        $quote = Quote::factory()->create();

        $response = $this->getJson("/api/v1/quotes/{$quote->id}/pdf/download");

        $response->assertOk();
        expect($response->headers->get('content-type'))->toContain('application/pdf');
    });

    it('can preview PDF', function () {
        $quote = Quote::factory()->create();

        $response = $this->getJson("/api/v1/quotes/{$quote->id}/pdf/preview");

        $response->assertOk();
        expect($response->headers->get('content-type'))->toContain('application/pdf');
    });

    it('requires view permission for PDF operations', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $quote = Quote::factory()->create();
        $response = $this->getJson("/api/v1/quotes/{$quote->id}/pdf/download");

        $response->assertForbidden();
    });
});
