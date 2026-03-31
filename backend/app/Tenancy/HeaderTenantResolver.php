<?php

declare(strict_types=1);

namespace App\Tenancy;

use App\Models\Tenant as TenantModel;
use Illuminate\Http\Request;
use Stancl\Tenancy\Contracts\Tenant;
use Stancl\Tenancy\Resolvers\RequestDataTenantResolver;

/**
 * Resolves tenant from the X-Tenant request header.
 *
 * This wraps stancl's built-in RequestDataTenantResolver, providing a clean
 * application-level abstraction for header-based tenant identification.
 */
class HeaderTenantResolver
{
    public function __construct(private readonly RequestDataTenantResolver $resolver) {}

    public function resolveWithoutFailing(Request $request): ?Tenant
    {
        $tenantId = $request->header('X-Tenant');

        if (! $tenantId) {
            return null;
        }

        return TenantModel::find($tenantId);
    }

    public function resolve(Request $request): Tenant
    {
        $tenant = $this->resolveWithoutFailing($request);

        if (! $tenant) {
            abort(404, 'Tenant not found');
        }

        return $tenant;
    }
}
