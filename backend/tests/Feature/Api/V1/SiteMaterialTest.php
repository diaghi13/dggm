<?php

use App\Models\Customer;
use App\Models\Material;
use App\Models\Quote;
use App\Models\QuoteItem;
use App\Models\Site;
use App\Models\SiteMaterial;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

use function Pest\Laravel\assertDatabaseHas;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->user = User::factory()->create();
    $this->user->assignRole('project-manager');
    Sanctum::actingAs($this->user);
});

it('can list site materials', function () {
    $site = Site::factory()->create();
    $material = Material::factory()->create();
    SiteMaterial::factory()->create([
        'site_id' => $site->id,
        'material_id' => $material->id,
    ]);

    $response = $this->getJson("/api/v1/sites/{$site->id}/materials");

    $response->assertSuccessful()
        ->assertJsonStructure([
            'success',
            'data' => [
                '*' => [
                    'id',
                    'material_id',
                    'planned_quantity',
                    'used_quantity',
                    'status',
                ],
            ],
        ]);
});

it('can add material to site as extra', function () {
    $site = Site::factory()->create();
    $material = Material::factory()->create();

    $response = $this->postJson("/api/v1/sites/{$site->id}/materials", [
        'material_id' => $material->id,
        'planned_quantity' => 10,
        'planned_unit_cost' => 50.00,
        'extra_reason' => 'Customer requested additional work',
    ]);

    $response->assertSuccessful();

    assertDatabaseHas('site_materials', [
        'site_id' => $site->id,
        'material_id' => $material->id,
        'is_extra' => true,
        'requested_by' => $this->user->id,
        'extra_reason' => 'Customer requested additional work',
    ]);
});

it('auto-detects extras when no quote_item_id is provided', function () {
    $site = Site::factory()->create();
    $material = Material::factory()->create();

    $response = $this->postJson("/api/v1/sites/{$site->id}/materials", [
        'material_id' => $material->id,
        'planned_quantity' => 5,
        'planned_unit_cost' => 30.00,
        // No quote_item_id provided = auto-detected as extra
    ]);

    $response->assertSuccessful();

    assertDatabaseHas('site_materials', [
        'site_id' => $site->id,
        'material_id' => $material->id,
        'is_extra' => true,
        'requested_by' => $this->user->id,
    ]);
});

it('creates site with materials when quote is converted', function () {
    // Create quote with material items
    $customer = Customer::factory()->create();
    $material1 = Material::factory()->create();
    $material2 = Material::factory()->create();

    $quote = Quote::factory()->create([
        'customer_id' => $customer->id,
        'status' => 'approved',
        'title' => 'Test Quote for Site Conversion',
        'issue_date' => now(),
        'total_amount' => 1000.00,
    ]);

    QuoteItem::factory()->create([
        'quote_id' => $quote->id,
        'material_id' => $material1->id,
        'type' => 'material',
        'quantity' => 10,
        'unit_price' => 50.00,
    ]);

    QuoteItem::factory()->create([
        'quote_id' => $quote->id,
        'material_id' => $material2->id,
        'type' => 'material',
        'quantity' => 5,
        'unit_price' => 100.00,
    ]);

    // Convert quote to site
    $site = $quote->convertToSite();

    expect($site)->not->toBeNull();

    // Check that site materials were created
    assertDatabaseHas('site_materials', [
        'site_id' => $site->id,
        'material_id' => $material1->id,
        'is_extra' => false,
        'planned_quantity' => 10,
        'planned_unit_cost' => 50.00,
    ]);

    assertDatabaseHas('site_materials', [
        'site_id' => $site->id,
        'material_id' => $material2->id,
        'is_extra' => false,
        'planned_quantity' => 5,
        'planned_unit_cost' => 100.00,
    ]);
});

it('can log material usage', function () {
    $site = Site::factory()->create();
    $material = Material::factory()->create();
    $siteMaterial = SiteMaterial::factory()->create([
        'site_id' => $site->id,
        'material_id' => $material->id,
        'planned_quantity' => 100,
        'used_quantity' => 0,
    ]);

    $response = $this->postJson("/api/v1/sites/{$site->id}/materials/{$siteMaterial->id}/log-usage", [
        'quantity_used' => 25,
        'actual_unit_cost' => 55.00,
        'notes' => 'First usage batch',
    ]);

    $response->assertSuccessful();

    $siteMaterial->refresh();
    expect((float) $siteMaterial->used_quantity)->toBe(25.0);
    expect((float) $siteMaterial->actual_unit_cost)->toBe(55.0);
    expect($siteMaterial->status->value)->toBe('in_use');
});

it('can retrieve extras with cost summary', function () {
    $site = Site::factory()->create();
    $material1 = Material::factory()->create();
    $material2 = Material::factory()->create();

    // Create one extra material
    SiteMaterial::factory()->create([
        'site_id' => $site->id,
        'material_id' => $material1->id,
        'is_extra' => true,
        'used_quantity' => 10,
        'actual_unit_cost' => 50.00,
    ]);

    // Create one regular material from quote
    SiteMaterial::factory()->create([
        'site_id' => $site->id,
        'material_id' => $material2->id,
        'is_extra' => false,
        'used_quantity' => 5,
        'actual_unit_cost' => 30.00,
    ]);

    $response = $this->getJson("/api/v1/sites/{$site->id}/materials/extras");

    $response->assertSuccessful()
        ->assertJson([
            'success' => true,
            'summary' => [
                'total_extras' => 1,
                'total_extra_cost' => 500.00, // 10 * 50
            ],
        ]);
});

it('prevents logging usage beyond planned quantity', function () {
    $site = Site::factory()->create();
    $material = Material::factory()->create();
    $siteMaterial = SiteMaterial::factory()->create([
        'site_id' => $site->id,
        'material_id' => $material->id,
        'planned_quantity' => 10,
        'used_quantity' => 0,
    ]);

    $response = $this->postJson("/api/v1/sites/{$site->id}/materials/{$siteMaterial->id}/log-usage", [
        'quantity_used' => 15, // More than planned
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['quantity_used']);
});
