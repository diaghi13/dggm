<?php

declare(strict_types=1);

namespace App\Listeners;

use Stancl\Tenancy\Events\TenancyBootstrapped;

class FixTenantPublicDiskUrl
{
    /**
     * Fix the public disk URL to use tenant-specific path.
     *
     * FilesystemTenancyBootstrapper updates the disk root but not the URL.
     * This listener corrects the URL so that Storage::disk('public')->url()
     * generates paths accessible via the web (through tenant symlinks).
     */
    public function handle(TenancyBootstrapped $event): void
    {
        $tenantId = tenancy()->tenant->getTenantKey();
        $url = rtrim(config('app.url'), '/').'/storage/tenants/'.$tenantId;

        config(['filesystems.disks.public.url' => $url]);
    }
}
