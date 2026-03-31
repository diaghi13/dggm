<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Boot the testing helper traits.
     *
     * We override this to register the tenant migration path so that
     * RefreshDatabase includes tenant tables alongside landlord tables.
     */
    protected function setUpTraits(): array
    {
        // Register the tenant migration path with the migrator BEFORE
        // RefreshDatabase runs migrate:fresh, so both paths are included.
        $this->app['migrator']->path(database_path('migrations/tenant'));

        return parent::setUpTraits();
    }
}
