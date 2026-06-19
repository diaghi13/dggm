<?php

namespace App\Providers;

use App\Auth\GlobalSanctumGuard;
use App\Contracts\PaymentGatewayInterface;
use App\Services\Payment\NullPaymentGateway;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Stancl\Tenancy\Middleware\InitializeTenancyByRequestData;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(PaymentGatewayInterface::class, NullPaymentGateway::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register the 'global-sanctum' driver that uses GlobalSanctumGuard.
        // This guard uses LandlordPersonalAccessToken for token lookup so that
        // GlobalUser tokens (in the landlord DB) are found, while tenant user tokens
        // (in tenant DBs, using the standard Sanctum driver) remain unaffected.
        Auth::resolved(function ($auth) {
            $auth->extend('global-sanctum', function ($app, $name, array $config) use ($auth) {
                $guard = new \Illuminate\Auth\RequestGuard(
                    new GlobalSanctumGuard(
                        $auth,
                        config('sanctum.expiration'),
                        $config['provider'] ?? null,
                        config('sanctum.last_used_at', true)
                    ),
                    request(),
                    $auth->createUserProvider($config['provider'] ?? null)
                );

                app()->refresh('request', $guard, 'setRequest');

                return $guard;
            });
        });

        // Make tenant identification optional: when no x-tenant header/query param is
        // present, skip tenancy initialization instead of throwing an exception.
        // This allows global auth routes (login, me, tenants) to work without a tenant context.
        InitializeTenancyByRequestData::$onFail = function ($e, $request, $next) {
            return $next($request);
        };

        // Register policies for Spatie Permission models
        Gate::policy(Role::class, \App\Policies\RolePolicy::class);
        Gate::policy(Permission::class, \App\Policies\PermissionPolicy::class);

        // Product domain
        Gate::policy(\App\Domains\Product\Models\ProductUnitType::class, \App\Domains\Product\Policies\ProductUnitTypePolicy::class);

        // Email
        Gate::policy(\App\Models\EmailAccount::class, \App\Policies\EmailAccountPolicy::class);

        // Project Availability Check
        Gate::policy(\App\Domains\Project\Models\ProjectAvailabilityCheck::class, \App\Policies\ProjectAvailabilityCheckPolicy::class);

        // Project Services
        Gate::policy(\App\Domains\Project\Models\ProjectService::class, \App\Policies\ProjectServicePolicy::class);

        // Project Material Incidents
        Gate::policy(\App\Domains\Project\Models\ProjectMaterialIncident::class, \App\Policies\ProjectMaterialIncidentPolicy::class);

        // Rental Return Inspections
        Gate::policy(\App\Domains\Warehouse\Models\RentalReturnInspection::class, \App\Domains\Warehouse\Policies\RentalReturnInspectionPolicy::class);

        // Repair Orders
        Gate::policy(\App\Models\RepairOrder::class, \App\Domains\Warehouse\Policies\RepairOrderPolicy::class);

        // Final Balances
        Gate::policy(\App\Models\FinalBalance::class, \App\Policies\FinalBalancePolicy::class);

        // Register Microsoft Azure Socialite provider
        Event::listen(function (\SocialiteProviders\Manager\SocialiteWasCalled $event) {
            $event->extendSocialite('microsoft', \SocialiteProviders\Azure\Provider::class);
        });
    }
}
