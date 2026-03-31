<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\Plan;
use App\Models\Landlord\TenantMembership;
use App\Models\Landlord\TenantSubscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MigrateExistingDataCommand extends Command
{
    protected $signature = 'tenant:migrate-existing
        {--tenant-name= : Nome dell\'azienda (es. "Donghi SRL")}
        {--email= : Email del primo SuperAdmin}
        {--plan=full : Slug del piano (default: full)}
        {--dry-run : Simula senza scrivere}';

    protected $description = 'Migra i dati esistenti nel database principale al primo tenant multi-tenant';

    /** @var list<string> */
    private array $tablesToCopy = [
        // Lookup / reference tables (no FK towards other tenant tables)
        'product_relation_types',
        'product_unit_types',
        'product_categories',
        'product_brands',
        'payment_terms',
        'discount_families',
        'warranty_types',
        'project_roles',
        'rental_profiles',
        // Settings
        'settings',
        // Main entities
        'customers',
        'suppliers',
        'workers',
        'products',
        'product_relations',
        'warehouses',
        'inventory',
        'price_lists',
        // Quotes
        'quotes',
        'quote_items',
        // Projects
        'projects',
        'project_workers',
        'project_materials',
        // DDT
        'ddts',
        'ddt_items',
        // Stock
        'stock_movements',
    ];

    public function handle(): int
    {
        $tenantName = $this->option('tenant-name') ?? $this->ask('Nome dell\'azienda');
        $email = $this->option('email') ?? $this->ask('Email del SuperAdmin');
        $planSlug = $this->option('plan') ?? 'full';
        $dryRun = (bool) $this->option('dry-run');

        if ($dryRun) {
            $this->info('[DRY RUN] Simulazione — nessuna modifica verrà effettuata');
        }

        // 1. Verify the email exists among current tenant users
        $existingUser = User::where('email', $email)->first();

        if (! $existingUser) {
            $this->error("Nessun utente trovato con email: {$email}");

            return self::FAILURE;
        }

        $this->info("Utente trovato: {$existingUser->name} <{$existingUser->email}>");

        // 2. Verify the plan
        $plan = Plan::where('slug', $planSlug)->first();

        if (! $plan) {
            $this->error("Piano non trovato: {$planSlug}");
            $this->info('Piani disponibili: '.Plan::pluck('slug')->implode(', '));

            return self::FAILURE;
        }

        $this->info("Piano: {$plan->name}");

        // 3. Count existing data
        $tables = $this->getTableCounts();
        $this->table(
            ['Tabella', 'Record'],
            collect($tables)->map(fn ($count, $table) => [$table, $count])->values()->toArray()
        );

        if (! $this->confirm('Procedere con la migrazione?')) {
            return self::SUCCESS;
        }

        if ($dryRun) {
            $this->info('[DRY RUN] Fine simulazione. Nessuna modifica effettuata.');

            return self::SUCCESS;
        }

        // 4. Create GlobalUser from existing User
        $this->info('Creazione GlobalUser...');
        $globalUser = GlobalUser::firstOrCreate(
            ['email' => $email],
            [
                'name' => $existingUser->name,
                'password' => $existingUser->password, // already hashed
            ]
        );
        $this->info("GlobalUser creato/trovato: {$globalUser->id}");

        // 5. Create Tenant
        $this->info('Creazione Tenant...');
        $slug = Str::slug($tenantName).'-'.Str::random(4);
        $tenant = Tenant::create([
            'name' => $tenantName,
            'slug' => $slug,
        ]);
        $this->info("Tenant creato: {$tenant->id} ({$tenant->name})");

        // 6. Create Subscription (active — this is the first tenant, already "paid")
        TenantSubscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
        ]);

        // 7. Create TenantMembership
        TenantMembership::create([
            'global_user_id' => $globalUser->id,
            'tenant_id' => $tenant->id,
            'role' => 'admin',
            'status' => 'active',
        ]);

        // 8. stancl/tenancy auto-creates DB + runs migrations via JobPipeline on TenantCreated
        $this->info('Attendendo creazione DB tenant...');
        sleep(3);

        // 9. Copy data from main DB to tenant DB
        $this->info('Copia dati nel tenant DB...');
        $this->copyDataToTenant($tenant, $globalUser);

        $this->newLine();
        $this->info('Migrazione completata!');
        $this->info("Tenant ID: {$tenant->id}");
        $this->info("Per accedere usa header: x-tenant: {$tenant->id}");

        return self::SUCCESS;
    }

    /** @return array<string, int|string> */
    private function getTableCounts(): array
    {
        $tables = [
            'users', 'customers', 'suppliers', 'products',
            'projects', 'quotes', 'workers', 'warehouses',
        ];

        return collect($tables)->mapWithKeys(function (string $table): array {
            try {
                return [$table => DB::table($table)->count()];
            } catch (\Exception) {
                return [$table => 'N/A'];
            }
        })->toArray();
    }

    private function copyDataToTenant(Tenant $tenant, GlobalUser $globalUser): void
    {
        // Copy users first (separate handling for global_user_id)
        $this->copyUsers($tenant, $globalUser);

        foreach ($this->tablesToCopy as $table) {
            try {
                $rows = DB::table($table)->get()->toArray();

                if (empty($rows)) {
                    $this->line("  {$table}: vuota, skip");

                    continue;
                }

                $count = count($rows);

                $tenant->run(function () use ($table, $rows): void {
                    DB::statement('SET FOREIGN_KEY_CHECKS=0');

                    foreach (array_chunk($rows, 100) as $chunk) {
                        DB::table($table)->insertOrIgnore(
                            array_map(fn ($row) => (array) $row, $chunk)
                        );
                    }

                    DB::statement('SET FOREIGN_KEY_CHECKS=1');
                });

                $this->line("  {$table}: {$count} record copiati");
            } catch (\Exception $e) {
                $this->warn("  {$table}: ERRORE — {$e->getMessage()}");
            }
        }
    }

    private function copyUsers(Tenant $tenant, GlobalUser $globalUser): void
    {
        try {
            $users = DB::table('users')->get();

            $tenant->run(function () use ($users, $globalUser): void {
                DB::statement('SET FOREIGN_KEY_CHECKS=0');

                foreach ($users as $user) {
                    $userData = (array) $user;

                    // Assign global_user_id for the admin user
                    if ($user->email === $globalUser->email) {
                        $userData['global_user_id'] = $globalUser->id;
                    }

                    DB::table('users')->insertOrIgnore($userData);
                }

                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            });

            $this->line('  users: '.count($users).' record copiati');
        } catch (\Exception $e) {
            $this->warn("  users: ERRORE — {$e->getMessage()}");
        }
    }
}
