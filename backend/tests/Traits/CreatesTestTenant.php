<?php

declare(strict_types=1);

namespace Tests\Traits;

use App\Models\Tenant;

trait CreatesTestTenant
{
    protected Tenant $tenant;

    public function setUpTenant(): void
    {
        $this->tenant = Tenant::create([
            'name' => 'Test Company',
            'slug' => 'test-company-'.uniqid(),
        ]);
    }

    public function tearDownTenant(): void
    {
        if (isset($this->tenant)) {
            tenancy()->end();
            $this->tenant->delete();
        }
    }
}
