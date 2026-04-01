<?php

declare(strict_types=1);

namespace App\Enums;

enum BootstrapStatus: string
{
    case Pending = 'pending';
    case DatabaseCreated = 'database_created';
    case Migrated = 'migrated';
    case StorageReady = 'storage_ready';
    case Seeded = 'seeded';
    case Bootstrapping = 'bootstrapping';
    case Ready = 'ready';
    case Failed = 'failed';
}
